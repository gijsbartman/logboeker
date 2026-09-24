import { EditorView } from "@codemirror/view";
import { screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoFs } from "@/lib/demo-fs";
import { renderApp } from "./render-app";

const PATH = "logboek/daily/2026-09-15.md";

async function edit(title: string) {
  const app = renderApp();
  await app.user.click(await screen.findByRole("button", { name: `${title} bewerken` }));
  const content = await waitFor(() => {
    const element = document.querySelector<HTMLElement>(".cm-content");
    if (!element) throw new Error("Editor did not open");
    return element;
  });
  return { ...app, view: EditorView.findFromDOM(content)! };
}

const title = "Check-in met label op de verkeerde plek";

test("editing in place autosaves the body and leaves the frontmatter alone", async () => {
  const before = (await demoFs.readText(PATH))!;
  const { view } = await edit(title);

  view.dispatch({ changes: { from: view.state.doc.length, insert: "\nNieuwe regel.\n" } });

  expect(await screen.findByText("Opgeslagen", {}, { timeout: 3000 })).toBeInTheDocument();
  const after = (await demoFs.readText(PATH))!;
  expect(after).toBe(`${before}\nNieuwe regel.\n`);
});

test("a selection can be labelled with a skill and level", async () => {
  const { user, view } = await edit(title);
  const doc = view.state.doc.toString();
  const from = doc.indexOf("Merge wacht");
  view.dispatch({ selection: { anchor: from, head: from + "Merge wacht".length } });

  await user.click(await screen.findByRole("button", { name: "Labelen" }));
  await user.click(screen.getByRole("checkbox", { name: /Samenwerken/ }));
  await user.click(screen.getByRole("radio", { name: "N2" }));
  await user.click(screen.getByRole("button", { name: "Toepassen" }));

  expect(view.state.doc.toString()).toContain("[Merge wacht]{.samenwerken niveau=2}");
});

test("an existing label opens prefilled and can be removed", async () => {
  const { user, view } = await edit(title);
  const doc = view.state.doc.toString();
  view.dispatch({ selection: { anchor: doc.indexOf("opmerkingen verwerkt") } });

  await user.click(await screen.findByRole("button", { name: "Label bewerken" }));
  expect(screen.getByRole("checkbox", { name: /Kritisch oordelen/ })).toBeChecked();
  expect(screen.getByRole("radio", { name: "N3" })).toHaveAttribute("aria-checked", "true");

  await user.click(screen.getByRole("button", { name: "Label verwijderen" }));
  expect(view.state.doc.toString()).not.toContain("{.kritisch-oordelen");
});

test("in the check-in section labelling is refused with the reason", async () => {
  const { user, view } = await edit(title);
  const doc = view.state.doc.toString();
  const from = doc.indexOf("Wie reviewt?");
  view.dispatch({ selection: { anchor: from, head: from + 4 } });

  await user.click(await screen.findByRole("button", { name: "Labelen" }));
  expect(await screen.findByText(/Planning is geen bewijs/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Toepassen" })).not.toBeInTheDocument();
});

test("a change on disk while editing shows a conflict instead of overwriting", async () => {
  const { user, view, queryClient } = await edit(title);
  view.dispatch({ changes: { from: view.state.doc.length, insert: "\nMijn regel.\n" } });

  const external = `${(await demoFs.readText(PATH))!}\nDoor een skill geschreven.\n`;
  await demoFs.writeText(PATH, external);
  await queryClient.invalidateQueries();

  expect(await screen.findByText("Dit bestand is buiten de app gewijzigd", {}, { timeout: 3000 })).toBeInTheDocument();
  expect(await demoFs.readText(PATH)).toBe(external);

  await user.click(screen.getByRole("button", { name: "Mijn tekst bewaren" }));
  await waitFor(async () => expect(await demoFs.readText(PATH)).toContain("Mijn regel."));
});

test("Escape closes the editor", async () => {
  const { user } = await edit(title);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(document.querySelector(".cm-content")).toBeNull());
  expect(screen.getByRole("button", { name: `${title} bewerken` })).toBeInTheDocument();
});

test("goals are added from existing ones, and a near-duplicate is flagged", async () => {
  const { user } = await edit(title);
  await user.click(screen.getByRole("button", { name: "Doel toevoegen" }));
  await user.type(screen.getByPlaceholderText(/Zoek of maak een doel/), "js-interops");
  expect(await screen.findByText(/Lijkt op bestaand doel “js-interop”/)).toBeInTheDocument();

  await user.clear(screen.getByPlaceholderText(/Zoek of maak een doel/));
  await user.click(await screen.findByRole("option", { name: "Onboarding" }));
  await waitFor(async () => expect(await demoFs.readText(PATH)).toMatch(/^doelen: \[token-laag, onboarding\]$/m));
});
