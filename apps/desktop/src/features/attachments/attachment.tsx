import { cn } from "cn";
import {
  ChevronRight,
  ExternalLink,
  FileText,
  FileWarning,
  Image,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ComponentProps } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import "@/features/editorial.css";

type AttachmentKind = "pdf" | "image" | "text" | "other";

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
const TEXT = /\.(txt|tex|md|csv|json|log|ya?ml)$/i;

export function attachmentKind(name: string): AttachmentKind {
  if (/\.pdf$/i.test(name)) return "pdf";
  if (IMAGE.test(name)) return "image";
  if (TEXT.test(name)) return "text";
  return "other";
}

type AttachmentContextValue = {
  name: string;
  url: string | null;
  kind: AttachmentKind;
  openExternally?: () => void;
};

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

function useAttachment() {
  const context = useContext(AttachmentContext);
  if (!context)
    throw new Error("Attachment parts must be used inside <Attachment.Root>");
  return context;
}

type RootProps = ComponentProps<typeof Collapsible> & {
  name: string;
  url: string | null;
  openExternally?: () => void;
};

function Root({
  name,
  url,
  openExternally,
  className,
  children,
  ...props
}: RootProps) {
  return (
    <AttachmentContext.Provider
      value={{ name, url, kind: attachmentKind(name), openExternally }}
    >
      <Collapsible
        data-slot="attachment"
        data-missing={url === null}
        className={cn(
          "attachment-record border-y border-border/70 data-[missing=true]:border-dashed",
          className,
        )}
        {...props}
      >
        {children}
      </Collapsible>
    </AttachmentContext.Provider>
  );
}

const ICONS = { pdf: FileText, image: Image, text: FileText, other: FileText };

function Trigger({ className, ...props }: ComponentProps<"button">) {
  const { name, url, kind, openExternally } = useAttachment();
  const Icon = url === null ? FileWarning : ICONS[kind];
  const previewable = url !== null && kind !== "other";

  return (
    <div className="flex items-center gap-3 py-3 text-xs">
      <CollapsibleTrigger
        disabled={url === null || (!previewable && !openExternally)}
        onClick={(event) => {
          if (previewable) return;
          event.preventDefault();
          openExternally?.();
        }}
        className={cn(
          "group flex min-w-0 flex-1 items-center gap-2.5 text-left transition-colors hover:text-primary disabled:cursor-default focus-visible:outline-2 focus-visible:outline-ring",
          className,
        )}
        {...props}
      >
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-disabled:invisible group-data-[state=open]:rotate-90" />
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{name}</span>
        {url === null && (
          <span className="text-xs text-destructive">ontbreekt</span>
        )}
      </CollapsibleTrigger>
      {url !== null && openExternally && (
        <button
          type="button"
          onClick={openExternally}
          aria-label={`${name} openen`}
          className="p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ExternalLink className="size-4" />
        </button>
      )}
    </div>
  );
}

function Preview({ className, ...props }: ComponentProps<"div">) {
  const { name, url, kind } = useAttachment();
  if (url === null || kind === "other") return null;

  return (
    <CollapsibleContent>
      <div className={cn("pb-3", className)} {...props}>
        {kind === "pdf" ? (
          <embed
            src={url}
            type="application/pdf"
            title={name}
            className="h-[70vh] w-full rounded-sm"
          />
        ) : kind === "text" ? (
          <TextPreview url={url} />
        ) : (
          <img
            src={url}
            alt={name}
            loading="lazy"
            className="mx-auto max-h-[70vh] rounded-sm"
          />
        )}
      </div>
    </CollapsibleContent>
  );
}

function TextPreview({ url }: { url: string }) {
  const { data, isError } = useQuery({
    queryKey: ["attachment-text", url],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      return response.text();
    },
  });

  if (isError)
    return <p className="text-xs text-destructive">Kon bestand niet lezen.</p>;

  return (
    <pre className="max-h-[70vh] overflow-auto rounded-sm bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
      {data ?? ""}
    </pre>
  );
}

export const Attachment = { Root, Trigger, Preview };
