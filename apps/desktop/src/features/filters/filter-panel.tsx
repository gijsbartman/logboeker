import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type GroupProps = {
  label: string;
  activeCount?: number;
  collapsible?: boolean;
  children: ReactNode;
};

function ActiveCount({ count }: { count?: number }) {
  if (!count) return null;
  return <span className="notebook-filter-active-count">{count}</span>;
}

function Group({
  label,
  activeCount,
  collapsible = false,
  children,
}: GroupProps) {
  if (!collapsible) {
    return (
      <SidebarGroup className="notebook-filter-group">
        <SidebarGroupLabel className="notebook-filter-label">
          {label}
          <ActiveCount count={activeCount} />
        </SidebarGroupLabel>
        <SidebarGroupContent>{children}</SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup className="notebook-filter-group">
        <SidebarGroupLabel className="notebook-filter-label" asChild>
          <CollapsibleTrigger>
            {label}
            <ActiveCount count={activeCount} />
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

type OptionProps = Omit<ComponentProps<typeof SidebarMenuButton>, "onClick"> & {
  active: boolean;
  count?: number;
  onToggle: () => void;
};

function Option({ active, count, onToggle, children, ...props }: OptionProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="notebook-filter-option"
        isActive={active}
        aria-pressed={active}
        onClick={onToggle}
        {...props}
      >
        {children}
      </SidebarMenuButton>
      {count !== undefined && (
        <SidebarMenuBadge className="notebook-filter-count">
          {count}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

type ChipsProps = {
  value: string[];
  onValueChange: (value: string[]) => void;
  "aria-label": string;
  className?: string;
  children: ReactNode;
};

function Chips({ className, ...props }: ChipsProps) {
  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      size="sm"
      className={cn("notebook-filter-chips flex-wrap justify-start", className)}
      {...props}
    />
  );
}

export const FilterPanel = {
  Group,
  Options: SidebarMenu,
  Option,
  Chips,
  Chip: ToggleGroupItem,
};
