import { PATHS } from "@logboeker/vault";
import {
  createFileRoute,
  Link,
  useCanGoBack,
  useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVault, useVaultSource } from "@/lib/vault";
import "@/features/vaults/vault-pages.css";

export const Route = createFileRoute("/_vault/instellingen")({
  component: Settings,
});

const LABELS: Record<string, string> = {
  student_naam: "Naam",
  projectnaam: "Project",
  rol: "Rol",
  semesterstart: "Semesterstart",
  sprintlengte_weken: "Sprintlengte in weken",
  semesterlengte_weken: "Semesterlengte in weken",
  code_repo: "Code-repository",
  tracker: "Tracker",
};

function BackButton() {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  if (canGoBack) {
    return (
      <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
        <ArrowLeft />
        Terug
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link to="/">
        <ArrowLeft />
        Naar overzicht
      </Link>
    </Button>
  );
}

function Settings() {
  const { config } = useVault();
  const source = useVaultSource();
  const known = Object.keys(LABELS).filter((key) => config[key] !== undefined);
  const other = Object.keys(config).filter((key) => !(key in LABELS));

  return (
    <main className="mx-auto min-h-svh max-w-4xl px-6 py-8 sm:px-12 sm:py-12">
      <div className="-ml-2.5">
        <BackButton />
      </div>
      <header className="mb-12 mt-14 border-b border-foreground/25 pb-9">
        <p className="vault-eyebrow">Jouw logboek</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-normal tracking-[-0.055em] sm:text-6xl">
          Instellingen
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          De gegevens achter je semester. Een overzicht van je project, je rol
          en je planning.
        </p>
      </header>
      <section
        aria-labelledby="config-title"
        className="grid gap-6 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-12"
      >
        <div>
          <p className="vault-eyebrow mb-3">01 / Profiel</p>
          <h2
            id="config-title"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight"
          >
            Het vertrekpunt
          </h2>
        </div>
        <dl className="border-t border-border text-sm">
          {[...known, ...other].map((key) => (
            <div key={key} className="settings-row">
              <dt className="text-muted-foreground">{LABELS[key] ?? key}</dt>
              <dd className="break-words font-medium [overflow-wrap:anywhere]">
                {String(config[key])}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section
        aria-labelledby="location-title"
        className="mt-14 grid gap-6 border-t pt-8 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-12"
      >
        <div>
          <p className="vault-eyebrow mb-3">02 / Bestanden</p>
          <h2
            id="location-title"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight"
          >
            Op jouw computer
          </h2>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <FileText
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-medium">{PATHS.config}</p>
              <p className="mt-1 break-all text-xs leading-relaxed text-muted-foreground">
                {source.root}
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Wil je iets aanpassen? Bewerk dit bestand in je teksteditor.
            Bewerken kan hier nog niet.
          </p>
        </div>
      </section>
    </main>
  );
}
