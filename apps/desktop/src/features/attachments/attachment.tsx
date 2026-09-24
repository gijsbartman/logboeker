import { cn } from "cn";
import { ChevronRight, ExternalLink, FileText, FileWarning, Image } from "lucide-react";
import { createContext, useContext, type ComponentProps } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type AttachmentKind = "pdf" | "image" | "other";

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

export function attachmentKind(name: string): AttachmentKind {
  if (/\.pdf$/i.test(name)) return "pdf";
  if (IMAGE.test(name)) return "image";
  return "other";
}

type AttachmentContextValue = { name: string; url: string | null; kind: AttachmentKind };

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

function useAttachment() {
  const context = useContext(AttachmentContext);
  if (!context) throw new Error("Attachment parts must be used inside <Attachment.Root>");
  return context;
}

type RootProps = ComponentProps<typeof Collapsible> & { name: string; url: string | null };

function Root({ name, url, className, children, ...props }: RootProps) {
  return (
    <AttachmentContext.Provider value={{ name, url, kind: attachmentKind(name) }}>
      <Collapsible
        data-slot="attachment"
        data-missing={url === null}
        className={cn("rounded-lg border bg-muted/30 data-[missing=true]:border-dashed", className)}
        {...props}
      >
        {children}
      </Collapsible>
    </AttachmentContext.Provider>
  );
}

const ICONS = { pdf: FileText, image: Image, other: FileText };

function Trigger({ className, ...props }: ComponentProps<"button">) {
  const { name, url, kind } = useAttachment();
  const Icon = url === null ? FileWarning : ICONS[kind];

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm">
      <CollapsibleTrigger
        disabled={url === null || kind === "other"}
        className={cn("group flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default", className)}
        {...props}
      >
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-disabled:invisible group-data-[state=open]:rotate-90" />
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-mono">{name}</span>
        {url === null && <span className="text-xs text-destructive">ontbreekt</span>}
      </CollapsibleTrigger>
      {url !== null && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${name} openen`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

function Preview({ className, ...props }: ComponentProps<"div">) {
  const { name, url, kind } = useAttachment();
  if (url === null || kind === "other") return null;

  return (
    <CollapsibleContent>
      <div className={cn("border-t p-2", className)} {...props}>
        {kind === "pdf" ? (
          <embed src={url} type="application/pdf" title={name} className="h-[70vh] w-full rounded-md" />
        ) : (
          <img src={url} alt={name} loading="lazy" className="mx-auto max-h-[70vh] rounded-md" />
        )}
      </div>
    </CollapsibleContent>
  );
}

export const Attachment = { Root, Trigger, Preview };
