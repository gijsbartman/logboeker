import { VAARDIGHEID_LABELS, type Vaardigheid } from "@logboeker/core";
import { cn } from "cn";
import type { ComponentProps, CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";

export function skillStyle(vaardigheid: Vaardigheid | undefined): CSSProperties {
  return { "--skill": vaardigheid ? `var(--skill-${vaardigheid})` : "var(--muted-foreground)" } as CSSProperties;
}

export function SkillDot({ vaardigheid, className, style, ...props }: ComponentProps<"span"> & { vaardigheid: Vaardigheid }) {
  return (
    <span
      aria-hidden
      style={{ ...skillStyle(vaardigheid), ...style }}
      className={cn("size-2 shrink-0 rounded-full bg-(--skill)", className)}
      {...props}
    />
  );
}

export function SkillBadge({ vaardigheid, className, ...props }: ComponentProps<typeof Badge> & { vaardigheid: Vaardigheid }) {
  return (
    <Badge variant="outline" className={className} {...props}>
      <SkillDot vaardigheid={vaardigheid} />
      {VAARDIGHEID_LABELS[vaardigheid]}
    </Badge>
  );
}

export function LevelBadge({ niveau, className, ...props }: ComponentProps<typeof Badge> & { niveau: number }) {
  return (
    <Badge variant="secondary" className={cn("tabular-nums", className)} {...props}>
      N{niveau}
    </Badge>
  );
}
