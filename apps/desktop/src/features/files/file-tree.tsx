import { ENTRY_DIRS } from "@logboeker/core";
import { PATHS } from "@logboeker/vault";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  File,
  FileText,
  Folder,
  Paperclip,
  Settings,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { useReferences } from "@/features/references/use-references";
import { useVault } from "@/lib/vault";

type FolderProps = {
  name: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
};

function TreeFolder({
  name,
  count,
  defaultOpen = false,
  children,
}: FolderProps) {
  return (
    <SidebarMenuItem>
      <Collapsible
        defaultOpen={defaultOpen}
        className="group/folder [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {count !== undefined && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0 pr-0">{children}</SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

type FileProps = Omit<ComponentProps<typeof SidebarMenuButton>, "onClick"> & {
  id: string;
  icon?: typeof File;
};

function TreeFile({ id, icon: Icon = File, children, ...props }: FileProps) {
  const references = useReferences();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={references.isOpen(id)}
        aria-pressed={references.isOpen(id)}
        onClick={() => references.toggle(id)}
        {...props}
      >
        <Icon />
        <span className="truncate">{children}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export const FileTree = { Folder: TreeFolder, File: TreeFile };

const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

export function VaultFileTree() {
  const { entries, files } = useVault();
  const logs = entries.filter((e) => e.kind === "log");
  const evidence = entries.filter((e) => e.kind === "bewijs");

  return (
    <SidebarGroup className="notebook-file-tree">
      <SidebarGroupContent>
        <SidebarMenu aria-label="Bestanden">
          <FileTree.Folder name="logboek" defaultOpen>
            <FileTree.Folder
              name={baseName(ENTRY_DIRS.log)}
              count={logs.length}
              defaultOpen
            >
              {logs.map((entry) => (
                <FileTree.File
                  key={entry.id}
                  id={entry.id}
                  icon={FileText}
                  title={entry.title}
                >
                  {`${baseName(entry.id)}.md`}
                </FileTree.File>
              ))}
            </FileTree.Folder>
            <FileTree.Folder
              name={baseName(ENTRY_DIRS.bewijs)}
              count={evidence.length}
            >
              {evidence.map((entry) => (
                <FileTree.File
                  key={entry.id}
                  id={entry.id}
                  icon={FileText}
                  title={entry.title}
                >
                  {`${baseName(entry.id)}.md`}
                </FileTree.File>
              ))}
            </FileTree.Folder>
            <FileTree.Folder name={baseName(PATHS.files)} count={files.length}>
              {files.map((name) => (
                <FileTree.File
                  key={name}
                  id={`${PATHS.files}/${name}`}
                  icon={Paperclip}
                >
                  {name}
                </FileTree.File>
              ))}
            </FileTree.Folder>
          </FileTree.Folder>
          <FileTree.Folder name="data">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/instellingen">
                  <Settings />
                  config.md
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </FileTree.Folder>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
