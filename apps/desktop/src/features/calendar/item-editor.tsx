import {
  VAARDIGHEDEN,
  VAARDIGHEID_LABELS,
  type RoadmapItem,
} from "@logboeker/core";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SkillDot } from "@/features/skills/skill-badge";
import { useDismiss } from "@/hooks/use-dismiss";
import { humanise, slugify } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { today, useEditRoadmap, useRemoveItem } from "./use-roadmap";

const NEW_DOEL = "__nieuw";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function Group({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y rounded-lg border bg-card text-sm">{children}</div>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 px-3 py-1.5">
      <label htmlFor={htmlFor} className="text-sm">
        {label}
      </label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

const dateInput = "h-8 w-40 border-0 bg-muted shadow-none";

function BewijsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { entries, resolver } = useVault();
  const [draft, setDraft] = useState("");
  const names = entries
    .filter((entry) => entry.kind === "bewijs")
    .map((entry) => entry.portflowNaam ?? entry.title);

  const add = () => {
    const name = draft.trim();
    if (name && !value.includes(name)) onChange([...value, name]);
    setDraft("");
  };

  return (
    <div className="space-y-2 px-3 py-3">
      <label htmlFor="roadmap-bewijs" className="text-sm">
        Bewijs
      </label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Gekoppeld bewijs">
          {value.map((key) => (
            <li
              key={key}
              className="flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-xs"
            >
              {key}
              {!resolver.resolve(key) && (
                <span className="text-muted-foreground">
                  · nog niet gevonden
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`${key} ontkoppelen`}
                onClick={() => onChange(value.filter((k) => k !== key))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id="roadmap-bewijs"
          list="roadmap-bewijs-namen"
          value={draft}
          placeholder="Portflow-naam"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          Koppelen
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Mag ook een bewijsstuk zijn dat je nog gaat maken.
      </p>
      <datalist id="roadmap-bewijs-namen">
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}

// Every field saves on its own, so only what changed is written and an
// untouched `week 3` keeps its notation. Text fields save when you leave
// them or press Enter.
export function ItemEditor({
  item,
  onDone,
}: {
  item: RoadmapItem;
  onDone: () => void;
}) {
  const { doelen } = useVault();
  const edit = useEditRoadmap();
  const removal = useRemoveItem();
  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const [titel, setTitel] = useState(item.titel);
  const [datum, setDatum] = useState(item.start);
  const [tot, setTot] = useState(item.eind);
  const [nieuwDoel, setNieuwDoel] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const save = (fields: Record<string, unknown>) =>
    edit.mutate([{ action: "update", index: item.index, fields }]);

  const commitTitel = () => {
    const next = titel.trim();
    if (!next) setTitel(item.titel);
    else if (next !== item.titel) save({ titel: next });
  };

  const commitNieuwDoel = () => {
    const slug = slugify(nieuwDoel ?? "");
    if (!slug) return;
    save({ doel: slug });
    setNieuwDoel(null);
  };

  const commitDates = (nextDatum: string, nextTot: string) => {
    if (!ISO_DATE.test(nextDatum)) return setProblem("Kies een datum");
    if (item.meerdaags && !ISO_DATE.test(nextTot))
      return setProblem("Kies een einddatum");
    if (item.meerdaags && nextTot < nextDatum)
      return setProblem("Het einde ligt voor de start");
    setProblem(null);
    const fields: Record<string, unknown> = {};
    if (nextDatum !== item.start) fields.datum = nextDatum;
    if (item.meerdaags && nextTot !== item.eind) fields.tot = nextTot;
    if (Object.keys(fields).length > 0) save(fields);
  };

  // Switching between one day and a range changes what a week number means,
  // so the start date is then written out in full.
  const setMeerdaags = (meerdaags: boolean) => {
    setTot(item.start);
    save({ datum: item.start, tot: meerdaags ? item.start : null });
  };

  const finish = () => {
    commitTitel();
    if (nieuwDoel !== null) commitNieuwDoel();
    onDone();
  };

  useDismiss(root, finish);

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    title.current?.select();

  }, []);

  const options =
    item.doel && !doelen.includes(item.doel) ? [item.doel, ...doelen] : doelen;
  const error = problem ?? edit.error?.message ?? removal.error?.message;

  return (
    <div
      ref={root}
      className="space-y-4"
      onKeyDown={(event) => {
        if (event.key === "Escape") finish();
      }}
    >
      <Input
        ref={title}
        aria-label="Titel"
        value={titel}
        autoComplete="off"
        onChange={(event) => setTitel(event.target.value)}
        onBlur={commitTitel}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitTitel();
        }}
        className="h-auto border-0 bg-transparent px-0 font-(family-name:--font-display) text-xl shadow-none focus-visible:ring-0 md:text-xl dark:bg-transparent"
      />

      <Group>
        <Row label={item.meerdaags ? "Van" : "Datum"} htmlFor="roadmap-datum">
          <Input
            id="roadmap-datum"
            type="date"
            value={datum}
            onChange={(event) => {
              setDatum(event.target.value);
              commitDates(event.target.value, tot);
            }}
            className={dateInput}
          />
        </Row>
        <Row label="Meerdaags" htmlFor="roadmap-meerdaags">
          <Switch
            id="roadmap-meerdaags"
            checked={item.meerdaags}
            onCheckedChange={setMeerdaags}
          />
        </Row>
        {item.meerdaags && (
          <Row label="Tot" htmlFor="roadmap-tot">
            <Input
              id="roadmap-tot"
              type="date"
              value={tot}
              onChange={(event) => {
                setTot(event.target.value);
                commitDates(datum, event.target.value);
              }}
              className={dateInput}
            />
          </Row>
        )}
        <Row label="Afgerond" htmlFor="roadmap-afgerond">
          <Switch
            id="roadmap-afgerond"
            checked={!!item.afgerond}
            onCheckedChange={(checked) =>
              save({ afgerond: checked ? today() : null })
            }
          />
        </Row>
        {item.afgerond && (
          <Row label="Afgerond op" htmlFor="roadmap-afgerond-op">
            <Input
              id="roadmap-afgerond-op"
              type="date"
              defaultValue={item.afgerond}
              onChange={(event) => {
                if (ISO_DATE.test(event.target.value))
                  save({ afgerond: event.target.value });
              }}
              className={dateInput}
            />
          </Row>
        )}
      </Group>

      <Group>
        <Row label="Doel" htmlFor="roadmap-doel">
          <select
            id="roadmap-doel"
            value={nieuwDoel !== null ? NEW_DOEL : (item.doel ?? "")}
            onChange={(event) => {
              const value = event.target.value;
              if (value === NEW_DOEL) return setNieuwDoel("");
              setNieuwDoel(null);
              save({ doel: value || null });
            }}
            className="h-8 max-w-48 rounded-md bg-muted px-2 text-sm"
          >
            <option value="">Geen doel</option>
            {options.map((slug) => (
              <option key={slug} value={slug}>
                {humanise(slug)}
              </option>
            ))}
            <option value={NEW_DOEL}>Nieuw doel…</option>
          </select>
        </Row>
        {nieuwDoel !== null && (
          <>
            <Row label="Naam van het doel" htmlFor="roadmap-nieuw-doel">
              <Input
                id="roadmap-nieuw-doel"
                autoComplete="off"
                autoFocus
                value={nieuwDoel}
                onChange={(event) => setNieuwDoel(event.target.value)}
                onBlur={commitNieuwDoel}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitNieuwDoel();
                }}
                className="h-8 w-44 bg-muted shadow-none"
              />
            </Row>
            {slugify(nieuwDoel) && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Zet <code>{slugify(nieuwDoel)}</code> in doelen: van je entries
                om ze hieraan te koppelen.
              </p>
            )}
          </>
        )}
      </Group>

      <Group>
        <fieldset className="px-3 py-3">
          <legend className="mb-2 text-sm">Vaardigheden</legend>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-x-4">
            {VAARDIGHEDEN.map((skill) => (
              <label
                key={skill}
                className="flex cursor-pointer items-center gap-2 py-1 text-sm"
              >
                <Checkbox
                  checked={item.vaardigheden.includes(skill)}
                  onCheckedChange={(checked) =>
                    save({
                      vaardigheden:
                        checked === true
                          ? [...item.vaardigheden, skill]
                          : item.vaardigheden.filter((s) => s !== skill),
                    })
                  }
                />
                <SkillDot vaardigheid={skill} />
                {VAARDIGHEID_LABELS[skill]}
              </label>
            ))}
          </div>
        </fieldset>
      </Group>

      <Group>
        <BewijsInput
          value={item.bewijs}
          onChange={(bewijs) => save({ bewijs })}
        />
      </Group>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        {confirming ? (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removal.remove(item.index, onDone)}
            >
              Definitief verwijderen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Behouden
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setConfirming(true)}
          >
            Verwijderen
          </Button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span>Esc klaar</span>
          <Button variant="ghost" size="sm" onClick={finish}>
            <Check className="size-3.5" /> Klaar
          </Button>
        </div>
      </div>
    </div>
  );
}
