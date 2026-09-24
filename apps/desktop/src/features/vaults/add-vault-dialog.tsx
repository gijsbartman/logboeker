import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Logboek toevoegen</DialogTitle>
          <DialogDescription>Open een bestaand logboek of maak een nieuw logboek aan.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="open">
          <TabsList className="w-full">
            <TabsTrigger value="open">Bestaand openen</TabsTrigger>
            <TabsTrigger value="new">Nieuw</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="pt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Kies de map waarin <code>data/config.md</code> en <code>logboek/</code> staan.
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
