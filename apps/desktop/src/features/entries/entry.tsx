import { VAARDIGHEID_LABELS, type Entry as EntryModel } from "@logboeker/core";
import { cn } from "cn";
import { useState, type ComponentProps, type ReactNode } from "react";
import { FileCheck2, Pencil, Text } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Attachment } from "@/features/attachments/attachment";
import { useFilters } from "@/features/filters/use-filters";
import { EntryEditor } from "@/features/editor/entry-editor";
import { MarkdownBody } from "@/features/markdown/markdown-body";
import { TagToggle } from "@/features/filters/tag-toggle";
import { SkillDot } from "@/features/skills/skill-badge";
import { formatDate, humanise } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { EntryContext, useEntry } from "./entry-context";

type RootProps = ComponentProps<"article"> & { entry: EntryModel };

function Root({ entry, className, children, ...props }: RootProps) {
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const toggleFile = (name: string) =>
    setOpenFiles((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  return (
    <EntryContext.Provider
      value={{ entry, openFiles, toggleFile, editing, setEditing }}
    >
      <article
        data-slot="entry"
        data-kind={entry.kind}
        data-editing={editing}
        className={cn("journal-entry", className)}
        {...props}
      >
        {children}
      </article>
    </EntryContext.Provider>
  );
}

function Title({ className, ...props }: ComponentProps<typeof CardTitle>) {
  const { entry } = useEntry();
  return (
    <h4 className={cn("journal-entry-title", className)} {...props}>
      {entry.title}
    </h4>
  );
}

function Meta({
  className,
  showDate = true,
  ...props
}: ComponentProps<typeof CardDescription> & { showDate?: boolean }) {
  const { entry } = useEntry();
  const parts = [
    showDate && formatDate(entry.date),
    entry.sprint && `sprint ${entry.sprint}`,
    entry.week && `week ${entry.week}`,
    entry.retroactief && "achteraf ingevuld",
  ].filter(Boolean);

  return (
    <CardDescription
      className={cn("journal-entry-meta first-letter:uppercase", className)}
      {...props}
    >
      {parts.join(" · ")}
    </CardDescription>
  );
}

function Actions({ className, ...props }: ComponentProps<typeof CardAction>) {
  return (
    <CardAction
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function Kind() {
  const { entry } = useEntry();
  const evidence = entry.kind === "bewijs";
  return (
    <span className="journal-entry-kind" data-evidence={evidence}>
      {evidence ? <FileCheck2 /> : <Text />}
      {evidence ? "Bewijs" : "Log"}
    </span>
  );
}

function EditButton() {
  const { entry, editing, setEditing } = useEntry();
  if (editing) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="journal-edit-button"
      aria-label={`${entry.title} bewerken`}
      onClick={() => setEditing(true)}
    >
      <Pencil />
    </Button>
  );
}

function Body({ className, ...props }: ComponentProps<typeof CardContent>) {
  const { entry, editing } = useEntry();
  return (
    <CardContent className={className} {...props}>
      {editing ? <EntryEditor /> : <MarkdownBody markdown={entry.body} />}
    </CardContent>
  );
}

function Attachments({
  className,
  ...props
}: ComponentProps<typeof CardContent>) {
  const { entry, openFiles, toggleFile } = useEntry();
  const { fileUrl, openFile } = useVault();
  if (entry.attachments.length === 0) return null;

  return (
    <CardContent className={cn("space-y-2", className)} {...props}>
      {entry.attachments.map((name) => (
        <Attachment.Root
          key={name}
          name={name}
          url={fileUrl(name)}
          openExternally={() => openFile(name)}
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
    <div className="journal-tag-row">
      <span className="journal-tag-label">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Tags({ className, ...props }: ComponentProps<typeof CardFooter>) {
  const { entry, editing } = useEntry();
  const filters = useFilters();
  const skills = entry.vaardigheden;
  if (editing || (entry.doelen.length === 0 && skills.length === 0))
    return null;

  return (
    <CardFooter className={cn("journal-entry-tags", className)} {...props}>
      {entry.doelen.length > 0 && (
        <TagRow label="Doel">
          {entry.doelen.map((doel) => (
            <TagToggle
              key={doel}
              active={filters.isActive("doel", doel)}
              onToggle={() => filters.toggle("doel", doel)}
            >
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

export const Entry = {
  Root,
  Header: CardHeader,
  Title,
  Meta,
  Actions,
  Kind,
  EditButton,
  Body,
  Attachments,
  Tags,
};
