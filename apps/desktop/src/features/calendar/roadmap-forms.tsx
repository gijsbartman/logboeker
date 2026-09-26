import { zodResolver } from "@hookform/resolvers/zod";
import {
  NIVEAUS,
  VAARDIGHEDEN,
  VAARDIGHEID_LABELS,
  type Doel,
  type Mijlpaal,
  type RoadmapEdit,
} from "@logboeker/core";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SkillDot } from "@/features/skills/skill-badge";
import { humanise, slugify } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { today, useEditRoadmap } from "./use-roadmap";

const optionalDate = z.union([
  z.literal(""),
  z.iso.date("Kies een geldige datum"),
]);

// Only fields the user changed are written, so untouched values such as
// `week 3` keep their notation in the file.
function changed(next: Record<string, unknown>, base: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(base[key]),
    ),
  );
}

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
};

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-6 overflow-y-auto rounded-sm p-7 sm:max-w-lg">
        <DialogHeader className="gap-3">
          <p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Roadmap
          </p>
          <DialogTitle className="font-[family-name:var(--font-display)] text-3xl font-normal tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

type InputFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: "text" | "date";
  description?: string;
  readOnly?: boolean;
};

function InputField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  description,
  readOnly,
}: InputFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`roadmap-${name}`}>{label}</FieldLabel>
          <Input
            {...field}
            id={`roadmap-${name}`}
            type={type}
            readOnly={readOnly}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

// A checkbox rather than an empty date input: WebKit shows an empty date
// field as today and offers no way to clear it.
function DoneDateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: Omit<InputFieldProps<T>, "type" | "readOnly">) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={field.value !== ""}
              onCheckedChange={(checked) =>
                field.onChange(checked === true ? today() : "")
              }
            />
            {label}
          </label>
          {field.value !== "" && (
            <Input
              {...field}
              id={`roadmap-${name}`}
              type="date"
              aria-label={`${label} op`}
              aria-invalid={fieldState.invalid}
            />
          )}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function FormFooter({
  error,
  pending,
  onCancel,
}: {
  error: Error | null;
  pending: boolean;
  onCancel: () => void;
}) {
  return (
    <>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" disabled={pending}>
          Opslaan
        </Button>
      </DialogFooter>
    </>
  );
}

type DoelValues = {
  titel: string;
  slug: string;
  van: string;
  tot: string;
  afgerond: string;
};

const doelFields = (values: DoelValues) => ({
  slug: values.slug,
  titel: values.titel,
  van: values.van,
  tot: values.tot,
  afgerond: values.afgerond || null,
});

function DoelForm({
  doel,
  slug,
  onDone,
}: {
  doel?: Doel;
  slug?: string;
  onDone: () => void;
}) {
  const { roadmap } = useVault();
  const edit = useEditRoadmap();
  const taken = roadmap.doelen
    .filter((d) => d.index !== doel?.index)
    .map((d) => d.slug);
  const schema = z
    .object({
      titel: z.string().trim().min(1, "Geef het doel een titel"),
      slug: z
        .string()
        .regex(
          /^[a-z0-9]+(-[a-z0-9]+)*$/,
          "Alleen kleine letters, cijfers en streepjes",
        )
        .refine((value) => !taken.includes(value), "Dit doel bestaat al"),
      van: z.iso.date("Kies een startdatum"),
      tot: z.iso.date("Kies een einddatum"),
      afgerond: optionalDate,
    })
    .refine((v) => v.tot >= v.van, {
      path: ["tot"],
      message: "Het einde ligt voor de start",
    });

  const base: DoelValues = doel
    ? {
        titel: doel.titel,
        slug: doel.slug,
        van: doel.van,
        tot: doel.tot,
        afgerond: doel.afgerond ?? "",
      }
    : {
        titel: slug ? humanise(slug) : "",
        slug: slug ?? "",
        van: today(),
        tot: "",
        afgerond: "",
      };
  const form = useForm<DoelValues>({
    resolver: zodResolver(schema),
    defaultValues: base,
  });

  const titel = form.watch("titel");
  const autoSlug = !doel && !slug;
  useEffect(() => {
    if (autoSlug && !form.getFieldState("slug").isDirty) {
      form.setValue("slug", slugify(titel));
    }
  }, [autoSlug, form, titel]);

  const submit = (values: DoelValues) => {
    const edits: RoadmapEdit[] = doel
      ? [
          {
            list: "doelen",
            action: "update",
            index: doel.index,
            fields: changed(doelFields(values), doelFields(base)),
          },
        ]
      : [{ list: "doelen", action: "add", fields: doelFields(values) }];
    edit.mutate(edits, { onSuccess: onDone });
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      <FieldGroup>
        <InputField control={form.control} name="titel" label="Titel" />
        <InputField
          control={form.control}
          name="slug"
          label="Slug"
          readOnly={!!doel || !!slug}
          description="Dezelfde naam als in doelen: van je entries"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            control={form.control}
            name="van"
            label="Van"
            type="date"
          />
          <InputField
            control={form.control}
            name="tot"
            label="Tot"
            type="date"
          />
        </div>
        <DoneDateField
          control={form.control}
          name="afgerond"
          label="Afgerond"
          description="Aanvinken zodra het doel geëvalueerd is"
        />
      </FieldGroup>
      <FormFooter
        error={edit.error}
        pending={edit.isPending}
        onCancel={onDone}
      />
    </form>
  );
}

type DoelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doel?: Doel;
  slug?: string;
};

export function DoelDialog({
  open,
  onOpenChange,
  doel,
  slug,
}: DoelDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={doel ? "Doel bewerken" : "Doel inplannen"}
      description="Een doel is een op te leveren product, met de periode waarin je eraan werkt."
    >
      <DoelForm doel={doel} slug={slug} onDone={() => onOpenChange(false)} />
    </FormDialog>
  );
}

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
    <div className="space-y-2">
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
          placeholder="Naam van het bewijsstuk"
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
      <datalist id="roadmap-bewijs-namen">
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}

const mijlpaalSchema = z.object({
  titel: z.string().trim().min(1, "Geef de mijlpaal een titel"),
  datum: z.iso.date("Kies een datum"),
  doel: z.string(),
  vaardigheden: z.array(z.enum(VAARDIGHEDEN)),
  niveau: z.string(),
  bewijs: z.array(z.string()),
  behaald: optionalDate,
});

type MijlpaalValues = z.infer<typeof mijlpaalSchema>;

const mijlpaalFields = (values: MijlpaalValues) => ({
  datum: values.datum,
  titel: values.titel,
  bewijs: values.bewijs,
  vaardigheden: values.vaardigheden,
  niveau: values.niveau ? Number(values.niveau) : null,
  doel: values.doel || null,
  behaald: values.behaald || null,
});

function MijlpaalForm({
  mijlpaal,
  datum,
  onDone,
}: {
  mijlpaal?: Mijlpaal;
  datum?: string;
  onDone: () => void;
}) {
  const { roadmap } = useVault();
  const edit = useEditRoadmap();
  const base: MijlpaalValues = mijlpaal
    ? {
        titel: mijlpaal.titel,
        datum: mijlpaal.datum,
        doel: mijlpaal.doel ?? "",
        vaardigheden: mijlpaal.vaardigheden,
        niveau: mijlpaal.niveau === null ? "" : String(mijlpaal.niveau),
        bewijs: mijlpaal.bewijs,
        behaald: mijlpaal.behaald ?? "",
      }
    : {
        titel: "",
        datum: datum ?? today(),
        doel: "",
        vaardigheden: [],
        niveau: "",
        bewijs: [],
        behaald: "",
      };
  const form = useForm<MijlpaalValues>({
    resolver: zodResolver(mijlpaalSchema),
    defaultValues: base,
  });

  const submit = (values: MijlpaalValues) => {
    const edits: RoadmapEdit[] = mijlpaal
      ? [
          {
            list: "mijlpalen",
            action: "update",
            index: mijlpaal.index,
            fields: changed(mijlpaalFields(values), mijlpaalFields(base)),
          },
        ]
      : [{ list: "mijlpalen", action: "add", fields: mijlpaalFields(values) }];
    edit.mutate(edits, { onSuccess: onDone });
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      <FieldGroup>
        <InputField control={form.control} name="titel" label="Titel" />
        <InputField
          control={form.control}
          name="datum"
          label="Datum"
          type="date"
        />
        <DoneDateField control={form.control} name="behaald" label="Behaald" />
        <Controller
          name="doel"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="roadmap-doel">Hoort bij doel</FieldLabel>
              <select
                {...field}
                id="roadmap-doel"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
              >
                <option value="">Geen doel</option>
                {roadmap.doelen.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.titel}
                  </option>
                ))}
              </select>
            </Field>
          )}
        />
        <Controller
          name="vaardigheden"
          control={form.control}
          render={({ field }) => (
            <FieldSet>
              <FieldLegend variant="label">Vaardigheden</FieldLegend>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {VAARDIGHEDEN.map((skill) => (
                  <label
                    key={skill}
                    className="flex cursor-pointer items-center gap-2 rounded-sm py-1 text-sm"
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
            </FieldSet>
          )}
        />
        <Controller
          name="niveau"
          control={form.control}
          render={({ field }) => (
            <FieldSet>
              <FieldLegend variant="label">Niveau</FieldLegend>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label="Niveau"
                className="w-full"
                value={field.value}
                onValueChange={field.onChange}
              >
                {NIVEAUS.map((n) => (
                  <ToggleGroupItem
                    key={n}
                    value={String(n)}
                    className="flex-1 font-mono text-xs"
                  >
                    N{n}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
          )}
        />
        <Controller
          name="bewijs"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="roadmap-bewijs">Bewijs</FieldLabel>
              <BewijsInput value={field.value} onChange={field.onChange} />
              <FieldDescription>
                De Portflow-naam of titel. Mag ook een bewijsstuk zijn dat nog
                gemaakt moet worden.
              </FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>
      <FormFooter
        error={edit.error}
        pending={edit.isPending}
        onCancel={onDone}
      />
    </form>
  );
}

type MijlpaalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mijlpaal?: Mijlpaal;
  datum?: string;
};

export function MijlpaalDialog({
  open,
  onOpenChange,
  mijlpaal,
  datum,
}: MijlpaalDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mijlpaal ? "Mijlpaal bewerken" : "Mijlpaal toevoegen"}
      description="Een moment in het semester dat je wilt halen, met het bewijs dat laat zien dat het gelukt is."
    >
      <MijlpaalForm
        mijlpaal={mijlpaal}
        datum={datum}
        onDone={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}
