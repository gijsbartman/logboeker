import { isVaardigheid, type Vaardigheid } from "@logboeker/core";
import type { ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useVault } from "@/lib/vault";
import { useFilters } from "@/features/filters/use-filters";
import { humanise } from "@/lib/format";
import { SkillCriteria } from "./skill-criteria";
import { skillStyle } from "./skill-badge";

type EvidenceSpanProps = {
  vaardigheden?: string;
  beroepstaken?: string;
  niveau?: string | number | null;
  children?: ReactNode;
};

const words = (value?: string) => (value ?? "").split(" ").filter(Boolean);

export function EvidenceSpan({ vaardigheden, beroepstaken, niveau, children }: EvidenceSpanProps) {
  const { criteria } = useVault();
  const { search } = useFilters();
  const skills = words(vaardigheden).filter(isVaardigheid) as Vaardigheid[];
  const tasks = words(beroepstaken);
  const level = niveau == null || niveau === "" ? null : Number(niveau);
  const lit = search.vaardigheid.length === 0 || skills.some((s) => search.vaardigheid.includes(s));

  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <mark
          tabIndex={0}
          data-lit={lit}
          style={skillStyle(skills[0])}
          className="rounded-sm bg-(--skill)/12 px-0.5 text-inherit underline decoration-(--skill) decoration-2 underline-offset-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[lit=false]:bg-transparent data-[lit=false]:no-underline"
        >
          {children}
        </mark>
      </HoverCardTrigger>
      <HoverCardContent
        collisionPadding={8}
        className="max-h-(--radix-hover-card-content-available-height) w-96 space-y-3 overflow-y-auto overscroll-contain"
      >
        {skills.map((skill) => (
          <SkillCriteria
            key={skill}
            vaardigheid={skill}
            niveau={level}
            level={level === null ? undefined : criteria[skill]?.levels[level]}
            defaultOpen={skills.length === 1}
          />
        ))}
        {tasks.length > 0 && (
          <p className="text-xs text-muted-foreground">Beroepstaak: {tasks.map(humanise).join(", ")}</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
