import { zodResolver } from "@hookform/resolvers/zod";
import {
  VAARDIGHEDEN,
  VAARDIGHEID_LABELS,
  type RoadmapItem,
} from "@logboeker/core";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SkillDot } from "@/features/skills/skill-badge";
import { humanise, slugify } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { today, useEditRoadmap, useRemoveItem } from "./use-roadmap";

const NEW_DOEL = "__nieuw";

const itemSchema = z
  .object({
    titel: z.string().trim().min(1, "Geef het item een titel"),
    datum: z.iso.date("Kies een datum"),
    meerdaags: z.boolean(),
    tot: z.string(),
    afgerond: z.union([z.literal(""), z.iso.date("Kies een geldige datum")]),
    doel: z.string(),
    nieuwDoel: z.string(),
    vaardigheden: z.array(z.enum(VAARDIGHEDEN)),
    bewijs: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.meerdaags && !/^\d{4}-\d{2}-\d{2}$/.test(values.tot)) {
      ctx.addIssue({
        code: "custom",
        path: ["tot"],
        message: "Kies een einddatum",
      });
    } else if (values.meerdaags && values.tot < values.datum) {
      ctx.addIssue({
        code: "custom",
        path: ["tot"],
        message: "Het einde ligt voor de start",
      });
    }
    if (values.doel === NEW_DOEL && !slugify(values.nieuwDoel)) {
      ctx.addIssue({
        code: "custom",
        path: ["nieuwDoel"],
        message: "Geef het doel een naam",
      });
    }
  });

type ItemValues = z.infer<typeof itemSchema>;

const itemFields = (values: ItemValues) => ({
  titel: values.titel,
  datum: values.datum,
  tot: values.meerdaags ? values.tot : null,
  doel:
    values.doel === NEW_DOEL ? slugify(values.nieuwDoel) : values.doel || null,
  vaardigheden: values.vaardigheden,
  bewijs: values.bewijs,
  afgerond: values.afgerond || null,
});

// Only changed fields are written, so an untouched `week 3` keeps its
// notation. Switching between one day and a range changes what a week
// number means, so the date is then written out in full.
function changedFields(values: ItemValues, base: ItemValues) {
  const next = itemFields(values);
  const before = itemFields(base);
  const fields: Record<string, unknown> = Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) =>
        JSON.stringify(value) !==
        JSON.stringify(before[key as keyof typeof before]),
    ),
  );
  if (values.meerdaags !== base.meerdaags) fields.datum = values.datum;
  return fields;
}

function Group({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y rounded-lg border bg-card text-sm">{children}</div>
  );
}

function Row({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-3 py-2">
      <div className="flex min-h-8 items-center justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm">
          {label}
        </label>
        <div className="flex items-center gap-2">{children}</div>
      </div>
      {error && (
        <p role="alert" className="pb-1 text-right text-xs text-destructive">
          {error}
        </p>
      )}
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

export type ItemDraft = {
  titel?: string;
  datum?: string;
  meerdaags?: boolean;
  doel?: string;
};

function ItemForm({
  item,
  draft,
  onDone,
}: {
  item?: RoadmapItem;
  draft?: ItemDraft;
  onDone: () => void;
}) {
  const { doelen } = useVault();
  const edit = useEditRoadmap();
  const removal = useRemoveItem();
  const [confirming, setConfirming] = useState(false);

  const base: ItemValues = item
    ? {
        titel: item.titel,
        datum: item.start,
        meerdaags: item.meerdaags,
        tot: item.meerdaags ? item.eind : "",
        afgerond: item.afgerond ?? "",
        doel: item.doel ?? "",
        nieuwDoel: "",
        vaardigheden: item.vaardigheden,
        bewijs: item.bewijs,
      }
    : {
        titel: draft?.titel ?? "",
        datum: draft?.datum ?? today(),
        meerdaags: draft?.meerdaags ?? false,
        tot: "",
        afgerond: "",
        doel: draft?.doel ?? "",
        nieuwDoel: "",
        vaardigheden: [],
        bewijs: [],
      };
  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: base,
  });
  const { errors } = form.formState;
  const meerdaags = form.watch("meerdaags");
  const doel = form.watch("doel");
  const nieuwDoel = form.watch("nieuwDoel");
  const options =
    base.doel && !doelen.includes(base.doel) ? [base.doel, ...doelen] : doelen;

  const submit = (values: ItemValues) =>
    edit.mutate(
      item
        ? [
            {
              action: "update",
              index: item.index,
              fields: changedFields(values, base),
            },
          ]
        : [{ action: "add", fields: itemFields(values) }],
      { onSuccess: onDone },
    );

  const error = edit.error ?? removal.error;

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div>
        <Input
          {...form.register("titel")}
          aria-label="Titel"
          placeholder="Nieuw item"
          autoComplete="off"
          aria-invalid={!!errors.titel}
          className="h-auto border-0 bg-transparent px-0 font-(family-name:--font-display) text-2xl shadow-none focus-visible:ring-0 md:text-2xl dark:bg-transparent"
        />
        {errors.titel && (
          <p role="alert" className="text-xs text-destructive">
            {errors.titel.message}
          </p>
        )}
      </div>

      <Group>
        <Row
          label={meerdaags ? "Van" : "Datum"}
          htmlFor="roadmap-datum"
          error={errors.datum?.message}
        >
          <Input
            {...form.register("datum")}
            id="roadmap-datum"
            type="date"
            className={dateInput}
          />
        </Row>
        <Row label="Meerdaags" htmlFor="roadmap-meerdaags">
          <Controller
            name="meerdaags"
            control={form.control}
            render={({ field }) => (
              <Switch
                id="roadmap-meerdaags"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (!checked) form.setValue("tot", "");
                }}
              />
            )}
          />
        </Row>
        {meerdaags && (
          <Row label="Tot" htmlFor="roadmap-tot" error={errors.tot?.message}>
            <Input
              {...form.register("tot")}
              id="roadmap-tot"
              type="date"
              className={dateInput}
            />
          </Row>
        )}
        <Controller
          name="afgerond"
          control={form.control}
          render={({ field }) => (
            <>
              <Row label="Afgerond" htmlFor="roadmap-afgerond">
                <Switch
                  id="roadmap-afgerond"
                  checked={field.value !== ""}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? today() : "")
                  }
                />
              </Row>
              {field.value !== "" && (
                <Row
                  label="Afgerond op"
                  htmlFor="roadmap-afgerond-op"
                  error={errors.afgerond?.message}
                >
                  <Input
                    id="roadmap-afgerond-op"
                    type="date"
                    value={field.value}
                    onChange={field.onChange}
                    className={dateInput}
                  />
                </Row>
              )}
            </>
          )}
        />
      </Group>

      <Group>
        <Row label="Doel" htmlFor="roadmap-doel">
          <select
            {...form.register("doel")}
            id="roadmap-doel"
            className="h-8 max-w-56 rounded-md bg-muted px-2 text-sm"
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
        {doel === NEW_DOEL && (
          <Row
            label="Naam van het doel"
            htmlFor="roadmap-nieuw-doel"
            error={errors.nieuwDoel?.message}
          >
            <Input
              {...form.register("nieuwDoel")}
              id="roadmap-nieuw-doel"
              autoComplete="off"
              className="h-8 w-48 bg-muted shadow-none"
            />
          </Row>
        )}
        {doel === NEW_DOEL && slugify(nieuwDoel) && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Zet <code>{slugify(nieuwDoel)}</code> in doelen: van je entries om
            ze hieraan te koppelen.
          </p>
        )}
      </Group>

      <Group>
        <Controller
          name="vaardigheden"
          control={form.control}
          render={({ field }) => (
            <fieldset className="px-3 py-3">
              <legend className="mb-2 text-sm">Vaardigheden</legend>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {VAARDIGHEDEN.map((skill) => (
                  <label
                    key={skill}
                    className="flex cursor-pointer items-center gap-2 py-1 text-sm"
                  >
                    <Checkbox
                      checked={field.value.includes(skill)}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked === true
                            ? [...field.value, skill]
                            : field.value.filter((s) => s !== skill),
                        )
                      }
                    />
                    <SkillDot vaardigheid={skill} />
                    {VAARDIGHEID_LABELS[skill]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        />
      </Group>

      <Group>
        <Controller
          name="bewijs"
          control={form.control}
          render={({ field }) => (
            <BewijsInput value={field.value} onChange={field.onChange} />
          )}
        />
      </Group>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <DialogFooter className="sm:justify-between">
        {item ? (
          confirming ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => removal.remove(item.index, onDone)}
              >
                Definitief verwijderen
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Behouden
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              onClick={() => setConfirming(true)}
            >
              Verwijderen
            </Button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
          <Button type="submit" disabled={edit.isPending}>
            {item ? "Opslaan" : "Toevoegen"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

type ItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: RoadmapItem;
  draft?: ItemDraft;
};

export function ItemDialog({
  open,
  onOpenChange,
  item,
  draft,
}: ItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto rounded-xl p-6 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{item ? "Item bewerken" : "Nieuw item"}</DialogTitle>
          <DialogDescription>
            Een moment of periode in je semesterplanning.
          </DialogDescription>
        </DialogHeader>
        <ItemForm
          item={item}
          draft={draft}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
