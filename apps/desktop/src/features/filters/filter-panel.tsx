import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  return (
    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
      {count}
    </Badge>
  );
}

function Group({ label, activeCount, collapsible = false, children }: GroupProps) {
  if (!collapsible) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          {label}
          <ActiveCount count={activeCount} />
        </SidebarGroupLabel>
        <SidebarGroupContent>{children}</SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
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
      <SidebarMenuButton isActive={active} aria-pressed={active} onClick={onToggle} {...props}>
        {children}
      </SidebarMenuButton>
      {count !== undefined && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
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
      className={cn("flex-wrap justify-start px-2", className)}
      {...props}
    />
  );
}

export const FilterPanel = { Group, Options: SidebarMenu, Option, Chips, Chip: ToggleGroupItem };
