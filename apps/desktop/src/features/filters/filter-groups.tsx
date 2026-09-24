import {
  NIVEAUS,
  VAARDIGHEDEN,
  VAARDIGHEID_LABELS,
  type EntryKind,
} from "@logboeker/core";
import { Switch } from "@/components/ui/switch";
import { SkillDot } from "@/features/skills/skill-badge";
import { humanise } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { FilterPanel } from "./filter-panel";
import { useFilters } from "./use-filters";

const KINDS: { value: EntryKind; label: string }[] = [
  { value: "log", label: "Logs" },
  { value: "bewijs", label: "Bewijs" },
];

export function FilterGroups() {
  const { entries, doelen } = useVault();
  const filters = useFilters();
  const { search } = filters;
  const count = (predicate: (e: (typeof entries)[number]) => boolean) =>
    entries.filter(predicate).length;

  return (
    <>
      <FilterPanel.Group
        label="Vaardigheid"
        activeCount={search.vaardigheid.length}
        collapsible
      >
        <FilterPanel.Options>
          {VAARDIGHEDEN.map((skill) => (
            <FilterPanel.Option
              key={skill}
              active={filters.isActive("vaardigheid", skill)}
              count={count((e) => e.vaardigheden.includes(skill))}
              onToggle={() => filters.toggle("vaardigheid", skill)}
            >
              <SkillDot vaardigheid={skill} />
              <span>{VAARDIGHEID_LABELS[skill]}</span>
            </FilterPanel.Option>
          ))}
        </FilterPanel.Options>
      </FilterPanel.Group>

      {doelen.length > 0 && (
        <FilterPanel.Group
          label="Doel"
          activeCount={search.doel.length}
          collapsible
        >
          <FilterPanel.Options>
            {doelen.map((doel) => (
              <FilterPanel.Option
                key={doel}
                active={filters.isActive("doel", doel)}
                count={count((e) => e.doelen.includes(doel))}
                onToggle={() => filters.toggle("doel", doel)}
              >
                <span>{humanise(doel)}</span>
              </FilterPanel.Option>
            ))}
          </FilterPanel.Options>
          <label className="notebook-group-toggle">
            <Switch
              checked={search.groep === "doel"}
              onCheckedChange={(checked) =>
                filters.setGroup(checked ? "doel" : "datum")
              }
            />
            Groepeer op doel
          </label>
        </FilterPanel.Group>
      )}

      <FilterPanel.Group label="Niveau" activeCount={search.niveau.length}>
        <FilterPanel.Chips
          aria-label="Niveau"
          value={search.niveau.map(String)}
          onValueChange={(values) => filters.set("niveau", values.map(Number))}
        >
          {NIVEAUS.map((niveau) => (
            <FilterPanel.Chip key={niveau} value={String(niveau)}>
              N{niveau}
            </FilterPanel.Chip>
          ))}
        </FilterPanel.Chips>
      </FilterPanel.Group>

      <FilterPanel.Group label="Soort" activeCount={search.soort.length}>
        <FilterPanel.Chips
          aria-label="Soort"
          value={search.soort}
          onValueChange={(values) =>
            filters.set("soort", values as EntryKind[])
          }
        >
          {KINDS.map((kind) => (
            <FilterPanel.Chip key={kind.value} value={kind.value}>
              {kind.label}
            </FilterPanel.Chip>
          ))}
        </FilterPanel.Chips>
      </FilterPanel.Group>
    </>
  );
}
