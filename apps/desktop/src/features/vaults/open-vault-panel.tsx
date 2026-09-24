import { ArrowUpRight, FolderOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InvalidVaultError, useOpenVault } from "./vault-actions";

export function OpenVaultPanel({ onAdded }: { onAdded?: () => void }) {
  const openVault = useOpenVault(onAdded);
  const error = openVault.error;

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => openVault.mutate(undefined)}
        disabled={openVault.isPending}
        className="h-11 w-full justify-between rounded-sm px-4"
      >
        <span className="flex items-center gap-3">
          <FolderOpen aria-hidden="true" />
          Map kiezen
        </span>
        <ArrowUpRight aria-hidden="true" />
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>
            {error instanceof InvalidVaultError
              ? "Dit is geen logboek"
              : "Openen mislukt"}
          </AlertTitle>
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
