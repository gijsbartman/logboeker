import { VAARDIGHEID_LABELS, type Level, type Vaardigheid } from "@logboeker/core";
import { ChevronRight } from "lucide-react";
import Markdown from "react-markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LevelBadge, skillStyle } from "./skill-badge";

type SkillCriteriaProps = {
  vaardigheid: Vaardigheid;
  niveau: number | null;
  level: Level | undefined;
  defaultOpen?: boolean;
};

export function SkillCriteria({ vaardigheid, niveau, level, defaultOpen = true }: SkillCriteriaProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      style={skillStyle(vaardigheid)}
      className="group/criteria border-l-2 border-(--skill) pl-3"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 text-left">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/criteria:rotate-90" />
        <h4 className="text-sm font-medium">{VAARDIGHEID_LABELS[vaardigheid]}</h4>
        {niveau !== null && <LevelBadge niveau={niveau} className="ml-auto" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1.5">
        {level ? (
          <div className="prose prose-sm dark:prose-invert text-muted-foreground">
            {level.subtitle && <p className="font-medium text-foreground">{level.subtitle}</p>}
            {level.description && <Markdown>{level.description}</Markdown>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Geen criteria voor dit niveau gevonden.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
