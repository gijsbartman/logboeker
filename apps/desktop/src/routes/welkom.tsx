import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { NotebookBrand } from "@/features/layout/notebook-brand";
import { NewVaultForm } from "@/features/vaults/new-vault-form";
import { OpenVaultPanel } from "@/features/vaults/open-vault-panel";
import "@/features/vaults/vault-pages.css";

export const Route = createFileRoute("/welkom")({
  beforeLoad: ({ context }) => {
    if (context.registry.active) throw redirect({ to: "/" });
  },
  component: Welcome,
});

function Welcome() {
  return (
    <main className="welcome-page">
      <section className="welcome-intro">
        <NotebookBrand />
        <header className="welcome-heading">
          <h1>
            Elke dag een
            <br />
            beetje verder.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Leg vast wat je doet, ontdek wat je leert.
            <br className="hidden sm:block" />
            Jouw semester, in je eigen woorden.
          </p>
        </header>
        <div className="journal-study" aria-hidden="true">
          <div className="journal-study-sheet journal-study-sheet-back" />
          <div className="journal-study-sheet journal-study-sheet-front">
            <div className="journal-study-topline">
              <span>Mijn logboek</span>
              <Asterisk size={18} strokeWidth={1.3} />
            </div>
            <div className="journal-study-title">
              Kleine stappen.
              <br />
              <em>Grote inzichten.</em>
            </div>
            <div className="journal-study-rule" />
            <div className="journal-study-rule" />
            <div className="journal-study-rule" />
            <div className="journal-study-footer">
              <span>Ideeën / Ervaringen / Groei</span>
              <span>01</span>
            </div>
          </div>
          <span className="journal-study-note">
            Werk in uitvoering <ArrowUpRight size={17} />
          </span>
        </div>
      </section>
      <div className="welcome-actions">
        <section className="welcome-section" aria-labelledby="open-vault-title">
          <div className="mb-6 flex items-start gap-4">
            <span className="vault-section-number">01</span>
            <div>
              <h2 id="open-vault-title" className="vault-section-title">
                Bestaand logboek openen
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ga verder waar je gebleven was. Kies de map van je logboek.
              </p>
            </div>
          </div>
          <OpenVaultPanel />
        </section>
        <section className="welcome-section" aria-labelledby="new-vault-title">
          <div className="mb-6 flex items-start gap-4">
            <span className="vault-section-number">02</span>
            <div>
              <h2 id="new-vault-title" className="vault-section-title">
                Nieuw logboek
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Een nieuw semester begint met een lege bladzijde.
              </p>
            </div>
          </div>
          <NewVaultForm />
        </section>
      </div>
    </main>
  );
}
