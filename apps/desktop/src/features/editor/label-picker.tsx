import { NIVEAUS, VAARDIGHEDEN, VAARDIGHEID_LABELS, type Vaardigheid } from "@logboeker/core";
import type { Labels } from "@logboeker/editor";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SkillCriteria } from "@/features/skills/skill-criteria";
import { SkillDot } from "@/features/skills/skill-badge";
import { useVault } from "@/lib/vault";

type LabelPickerProps = {
  initial: Labels | null;
  onApply: (labels: Labels) => void;
  onRemove?: () => void;
};

export function LabelPicker({ initial, onApply, onRemove }: LabelPickerProps) {
  const { criteria } = useVault();
  const [skills, setSkills] = useState<Vaardigheid[]>(initial?.vaardigheden ?? []);
  const [niveau, setNiveau] = useState<number | null>(initial?.niveau ?? null);

  const toggle = (skill: Vaardigheid, checked: boolean) =>
    setSkills((prev) => (checked ? [...prev, skill] : prev.filter((s) => s !== skill)));

  return (
    <div className="space-y-4">
      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">Vaardigheid</legend>
        {VAARDIGHEDEN.map((skill) => (
          <label key={skill} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={skills.includes(skill)} onCheckedChange={(checked) => toggle(skill, checked === true)} />
            <SkillDot vaardigheid={skill} />
            {VAARDIGHEID_LABELS[skill]}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">Niveau</legend>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Niveau"
          value={niveau === null ? "" : String(niveau)}
          onValueChange={(value) => setNiveau(value ? Number(value) : null)}
        >
          {NIVEAUS.map((n) => (
            <ToggleGroupItem key={n} value={String(n)}>
              N{n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>

      {niveau !== null && skills.length > 0 && (
        <div className="max-h-56 space-y-3 overflow-y-auto overscroll-contain">
          {skills.map((skill) => (
            <SkillCriteria
              key={skill}
              vaardigheid={skill}
              niveau={niveau}
              level={criteria[skill]?.levels[niveau]}
              defaultOpen={skills.length === 1}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Label verwijderen
          </Button>
        )}
        <Button
          size="sm"
          className="ml-auto"
          disabled={skills.length === 0 || niveau === null}
          onClick={() =>
            onApply({
              vaardigheden: skills,
              beroepstaken: initial?.beroepstaken ?? [],
              unknownClasses: initial?.unknownClasses,
              niveau,
            })
          }
        >
          Toepassen
        </Button>
      </div>
    </div>
  );
}
