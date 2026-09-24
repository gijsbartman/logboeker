import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateVault } from "./vault-actions";
import "./vault-pages.css";

const formSchema = z.object({
  student_naam: z.string().trim().min(1, "Vul je naam in"),
  projectnaam: z.string().trim().min(1, "Vul de projectnaam in"),
  rol: z.string().trim(),
  semesterstart: z.iso.date("Kies de eerste dag van het semester"),
  sprintlengte_weken: z.coerce.number<string>().int().min(1).max(8),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const FIELDS = [
  { name: "student_naam", label: "Naam", type: "text" },
  { name: "projectnaam", label: "Project", type: "text" },
  {
    name: "rol",
    label: "Rol",
    type: "text",
    description: "Bijvoorbeeld frontend of backend",
  },
  {
    name: "semesterstart",
    label: "Semesterstart",
    type: "date",
    description: "Hiermee worden sprint en week berekend",
  },
  {
    name: "sprintlengte_weken",
    label: "Sprintlengte in weken",
    type: "number",
  },
] as const;

export function NewVaultForm({ onAdded }: { onAdded?: () => void }) {
  const create = useCreateVault(onAdded);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_naam: "",
      projectnaam: "",
      rol: "",
      semesterstart: "",
      sprintlengte_weken: "2",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(({ rol, ...config }) =>
        create.mutate({ ...config, rol: rol || undefined }),
      )}
      className="vault-form space-y-6"
    >
      <FieldGroup className="vault-form-fields">
        {FIELDS.map((spec) => (
          <Controller
            key={spec.name}
            name={spec.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className={spec.name === "rol" ? "vault-form-full" : undefined}
              >
                <FieldLabel htmlFor={spec.name}>{spec.label}</FieldLabel>
                <Input
                  {...field}
                  id={spec.name}
                  type={spec.type}
                  aria-invalid={fieldState.invalid}
                />
                {"description" in spec && (
                  <FieldDescription>{spec.description}</FieldDescription>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
      </FieldGroup>
      {create.error && (
        <p className="text-sm text-destructive">{create.error.message}</p>
      )}
      <Button
        type="submit"
        disabled={create.isPending}
        className="h-11 w-full justify-between rounded-sm px-4"
      >
        Map kiezen en aanmaken
        <ArrowUpRight aria-hidden="true" />
      </Button>
    </form>
  );
}
