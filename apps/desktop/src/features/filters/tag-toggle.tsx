import { cn } from "cn";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";

type TagToggleProps = Omit<ComponentProps<"button">, "onClick"> & {
  active: boolean;
  onToggle: () => void;
};

export function TagToggle({ active, onToggle, className, children, ...props }: TagToggleProps) {
  return (
    <Badge variant="outline" asChild>
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={cn("cursor-pointer aria-pressed:border-foreground/30 aria-pressed:bg-accent", className)}
        {...props}
      >
        {children}
      </button>
    </Badge>
  );
}
