import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewVaultForm } from "./new-vault-form";
import { OpenVaultPanel } from "./open-vault-panel";

type AddVaultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddVaultDialog({ open, onOpenChange }: AddVaultDialogProps) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-6 overflow-y-auto rounded-sm p-7 sm:max-w-lg">
        <DialogHeader className="gap-3">
          <p className="vault-eyebrow">Een nieuwe bladzijde</p>
          <DialogTitle className="font-[family-name:var(--font-display)] text-3xl font-normal tracking-tight">
            Logboek toevoegen
          </DialogTitle>
          <DialogDescription>
            Open een bestaand logboek of maak een nieuw logboek aan.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="open">
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="open">Bestaand openen</TabsTrigger>
            <TabsTrigger value="new">Nieuw</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="pt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Kies de map van het logboek dat je wilt toevoegen.
            </p>
            <OpenVaultPanel onAdded={close} />
          </TabsContent>
          <TabsContent value="new" className="pt-4">
            <NewVaultForm onAdded={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
