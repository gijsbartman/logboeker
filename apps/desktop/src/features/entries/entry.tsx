import { VAARDIGHEID_LABELS, type Entry as EntryModel } from "@logboeker/core";
import { cn } from "cn";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Attachment } from "@/features/attachments/attachment";
import { useFilters } from "@/features/filters/use-filters";
import { MarkdownBody } from "@/features/markdown/markdown-body";
import { TagToggle } from "@/features/filters/tag-toggle";
import { SkillDot } from "@/features/skills/skill-badge";
import { formatDate, humanise } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { EntryContext, useEntry } from "./entry-context";

type RootProps = ComponentProps<typeof Card> & { entry: EntryModel };

function Root({ entry, className, children, ...props }: RootProps) {
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const toggleFile = (name: string) =>
    setOpenFiles((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  return (
    <EntryContext.Provider value={{ entry, openFiles, toggleFile }}>
      <Card data-slot="entry" data-kind={entry.kind} className={cn("gap-4", className)} {...props}>
        {children}
      </Card>
    </EntryContext.Provider>
  );
}

function Title({ className, ...props }: ComponentProps<typeof CardTitle>) {
  const { entry } = useEntry();
  return <CardTitle className={cn("text-base", className)} {...props}>{entry.title}</CardTitle>;
}

function Meta({ className, ...props }: ComponentProps<typeof CardDescription>) {
  const { entry } = useEntry();
  const parts = [
    formatDate(entry.date),
    entry.sprint && `sprint ${entry.sprint}`,
    entry.week && `week ${entry.week}`,
    entry.retroactief && "achteraf ingevuld",
  ].filter(Boolean);

  return (
    <CardDescription className={cn("first-letter:uppercase", className)} {...props}>
      {parts.join(" · ")}
    </CardDescription>
  );
}

function Kind(props: ComponentProps<typeof CardAction>) {
  const { entry } = useEntry();
  return (
    <CardAction {...props}>
      <Badge variant={entry.kind === "bewijs" ? "default" : "outline"}>{entry.kind === "bewijs" ? "Bewijs" : "Log"}</Badge>
    </CardAction>
  );
}

function Body({ className, ...props }: ComponentProps<typeof CardContent>) {
  const { entry } = useEntry();
  return (
    <CardContent className={className} {...props}>
      <MarkdownBody markdown={entry.body} />
    </CardContent>
  );
}

function Attachments({ className, ...props }: ComponentProps<typeof CardContent>) {
  const { entry, openFiles, toggleFile } = useEntry();
  const { fileUrl } = useVault();
  if (entry.attachments.length === 0) return null;

  return (
    <CardContent className={cn("space-y-2", className)} {...props}>
      {entry.attachments.map((name) => (
        <Attachment.Root
          key={name}
          name={name}
          url={fileUrl(name)}
          open={openFiles.includes(name)}
          onOpenChange={() => toggleFile(name)}
        >
          <Attachment.Trigger />
          <Attachment.Preview />
        </Attachment.Root>
      ))}
    </CardContent>
  );
}

function TagRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Tags({ className, ...props }: ComponentProps<typeof CardFooter>) {
  const { entry } = useEntry();
  const filters = useFilters();
  const skills = entry.vaardigheden;
  if (entry.doelen.length === 0 && skills.length === 0) return null;

  return (
    <CardFooter className={cn("flex-col items-stretch gap-2 border-t", className)} {...props}>
      {entry.doelen.length > 0 && (
        <TagRow label="Doel">
          {entry.doelen.map((doel) => (
            <TagToggle key={doel} active={filters.isActive("doel", doel)} onToggle={() => filters.toggle("doel", doel)}>
              {humanise(doel)}
            </TagToggle>
          ))}
        </TagRow>
      )}
      {skills.length > 0 && (
        <TagRow label="Vaardigheid">
          {skills.map((skill) => (
            <TagToggle
              key={skill}
              active={filters.isActive("vaardigheid", skill)}
              onToggle={() => filters.toggle("vaardigheid", skill)}
            >
              <SkillDot vaardigheid={skill} />
              {VAARDIGHEID_LABELS[skill]}
            </TagToggle>
          ))}
        </TagRow>
      )}
    </CardFooter>
  );
}

export const Entry = { Root, Header: CardHeader, Title, Meta, Kind, Body, Attachments, Tags };
