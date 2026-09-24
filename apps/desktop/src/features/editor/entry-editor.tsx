import type { SourceSpan } from "@logboeker/core";
import { inCheckIn, labelRange, livePreview, mentions, relabelSpan, spanAt, unlabelSpan, type Labels } from "@logboeker/editor";
import { markdown } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { Tag } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEntry } from "@/features/entries/entry-context";
import { useVault } from "@/lib/vault";
import { DoelenField } from "./doelen-field";
import { LabelPicker } from "./label-picker";
import { mentionItems } from "./mention-items";
import { useEntryDraft, type SaveStatus } from "./use-entry-draft";

type Anchor = {
  top: number;
  left: number;
  from: number;
  to: number;
  span: SourceSpan | null;
  checkIn: boolean;
};

function anchorFor(view: EditorView, wrapper: HTMLElement): Anchor | null {
  const { from, to, empty } = view.state.selection.main;
  const span = spanAt(view.state, from);
  if (empty && !span) return null;

  const coords = view.coordsAtPos(span ? span.from : from);
  const box = wrapper.getBoundingClientRect();
  return {
    top: coords ? coords.top - box.top : 0,
    left: coords ? coords.left - box.left : 0,
    from,
    to,
    span,
    checkIn: inCheckIn(view.state, span?.from ?? from, span?.to ?? to),
  };
}

const STATUS: Record<SaveStatus, string> = {
  idle: "",
  saving: "Opslaan…",
  saved: "Opgeslagen",
  error: "Opslaan mislukt",
};

export function EntryEditor() {
  const { entry, setEditing } = useEntry();
  const vault = useVault();
  const draft = useEntryDraft(entry);
  const wrapper = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [picking, setPicking] = useState(false);

  const latest = useRef({ vault, anchor, finish: () => {} });
  latest.current = {
    vault,
    anchor,
    finish: () => void draft.flush().then(() => setEditing(false)),
  };

  const extensions = useMemo(
    () => [
      markdown(),
      EditorView.lineWrapping,
      livePreview({
        resolveRef: (key) => latest.current.vault.resolver.resolve(key) !== null,
        hasFile: (name) => latest.current.vault.files.includes(name),
      }),
      mentions(() => mentionItems(latest.current.vault)),
      Prec.high(
        keymap.of([
          { key: "Mod-l", run: () => latest.current.anchor !== null && (setPicking(true), true) },
          { key: "Escape", run: () => (latest.current.finish(), true) },
        ]),
      ),
      EditorView.updateListener.of((update) => {
        if (update.selectionSet || update.docChanged || update.geometryChanged) {
          setAnchor(wrapper.current && anchorFor(update.view, wrapper.current));
        }
      }),
    ],
    [],
  );

  const apply = (labels: Labels) => {
    const current = view.current;
    if (!current || !anchor) return;
    current.dispatch(anchor.span ? relabelSpan(anchor.span, labels) : labelRange(anchor.from, anchor.to, labels));
    setPicking(false);
    current.focus();
  };

  const remove = () => {
    const current = view.current;
    if (!current || !anchor?.span) return;
    current.dispatch(unlabelSpan(anchor.span));
    setPicking(false);
    current.focus();
  };

  return (
    <div className="space-y-3">
      <DoelenField
        value={entry.doelen}
        options={vault.doelen}
        onChange={(doelen) => void draft.updateFields({ doelen })}
      />

      {draft.conflict !== null && (
        <Alert>
          <AlertTitle>Dit bestand is buiten de app gewijzigd</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Bijvoorbeeld door een skill. Jouw wijzigingen zijn nog niet opgeslagen.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={draft.takeTheirs}>
                Hun versie laden
              </Button>
              <Button size="sm" onClick={() => void draft.keepMine()}>
                Mijn tekst bewaren
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div ref={wrapper} className="relative rounded-md border bg-background">
        <CodeMirror
          value={draft.body}
          onChange={draft.setBody}
          onCreateEditor={(created) => {
            view.current = created;
            created.focus();
          }}
          extensions={extensions}
          theme="none"
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
            autocompletion: false,
          }}
          aria-label={`${entry.title} bewerken`}
          className="text-sm [&_.cm-content]:px-3 [&_.cm-content]:py-2 [&_.cm-editor]:outline-none"
        />

        {anchor && (
          <Popover open={picking} onOpenChange={setPicking}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="absolute z-10 h-7 -translate-y-full shadow-sm"
                style={{ top: anchor.top - 4, left: anchor.left }}
                onMouseDown={(event) => event.preventDefault()}
              >
                <Tag />
                {anchor.span ? "Label bewerken" : "Labelen"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              {anchor.checkIn ? (
                <p className="text-sm text-muted-foreground">
                  Dit is de check-in. Planning is geen bewijs, dus labels horen in de check-out.
                </p>
              ) : (
                <LabelPicker
                  key={anchor.span ? `${anchor.span.from}` : `${anchor.from}-${anchor.to}`}
                  initial={anchor.span?.attrs ?? null}
                  onApply={apply}
                  onRemove={anchor.span ? remove : undefined}
                />
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>⌘L labelen · @ verwijzen · Esc klaar</span>
        <span aria-live="polite">{STATUS[draft.status]}</span>
      </div>
    </div>
  );
}
