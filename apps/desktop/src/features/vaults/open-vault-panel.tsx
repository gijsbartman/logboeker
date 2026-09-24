import { FolderOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InvalidVaultError, useOpenVault } from "./vault-actions";

export function OpenVaultPanel({ onAdded }: { onAdded?: () => void }) {
  const openVault = useOpenVault(onAdded);
  const error = openVault.error;

  return (
    <div className="space-y-4">
      <Button onClick={() => openVault.mutate(undefined)} disabled={openVault.isPending} className="w-full">
        <FolderOpen />
        Map kiezen
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error instanceof InvalidVaultError ? "Dit is geen logboek" : "Openen mislukt"}</AlertTitle>
          <AlertDescription>
            {error instanceof InvalidVaultError ? (
              <ul className="list-disc pl-4">
                {error.missing.map((path) => (
                  <li key={path}>
                    <code>{path}</code> ontbreekt
                  </li>
                ))}
              </ul>
            ) : (
              error.message
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
