import { vaultState } from "./vault-mock";
import { createMemoryFs, scaffoldVault } from "@logboeker/vault";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { demoFs } from "@/lib/demo-fs";
import { useUiStore } from "@/lib/ui-store";
import { renderApp } from "./render-app";

beforeEach(async () => {
  vaultState.reset();
  useUiStore.setState({ sidebarTab: "filters" });

  const empty = createMemoryFs({});
  await scaffoldVault(empty, { projectnaam: "Tweede project", sprintlengte_weken: 2 });
  vaultState.disks.set("/vaults/demo", demoFs);
  vaultState.disks.set("/vaults/tweede", empty);
  vaultState.vaults = ["/vaults/demo", "/vaults/tweede"];
  vaultState.active = "/vaults/demo";
});

async function openSwitcher() {
  const { user, router } = renderApp();
  await screen.findByText("5 entries");
  await user.click(screen.getByRole("button", { name: /demo/ }));
  return { user, router, menu: within(await screen.findByRole("menu")) };
}

test("the switcher lists every vault by project name and switches", async () => {
  const { user, menu } = await openSwitcher();
  expect(menu.getByRole("menuitemradio", { name: /demo/ })).toHaveAttribute("aria-checked", "true");

  await user.click(menu.getByRole("menuitemradio", { name: "Tweede project" }));
  expect(await screen.findByText("Nog geen entries")).toBeInTheDocument();
  expect(vaultState.active).toBe("/vaults/tweede");
});

test("adding a vault is a dialog you can cancel without losing your place", async () => {
  const { user, router, menu } = await openSwitcher();
  await router.navigate({ to: "/", search: { soort: ["bewijs"] } });

  await user.click(menu.getByRole("menuitem", { name: /Logboek toevoegen/ }));
  expect(await screen.findByRole("dialog", { name: "Logboek toevoegen" })).toBeInTheDocument();
  await user.keyboard("{Escape}");

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(router.state.location.search).toMatchObject({ soort: ["bewijs"] });
  expect(screen.getByText("2 van 5")).toBeInTheDocument();
});

test("removing the active vault switches to the next one", async () => {
  const { user, menu } = await openSwitcher();
  await user.click(menu.getByRole("menuitem", { name: /Uit lijst verwijderen/ }));

  expect(await screen.findByText("Nog geen entries")).toBeInTheDocument();
  expect(vaultState.vaults).toEqual(["/vaults/tweede"]);
});

test("removing the last vault leads to the welcome screen", async () => {
  vaultState.vaults = ["/vaults/demo"];
  const { user, router, menu } = await openSwitcher();
  await user.click(menu.getByRole("menuitem", { name: /Uit lijst verwijderen/ }));

  expect(await screen.findByText("Bestaand logboek openen")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/welkom");
});

async function openFiles() {
  const { user, router } = renderApp();
  await screen.findByText("5 entries");
  await user.click(screen.getByRole("tab", { name: "Bestanden" }));
  return { user, router, tree: within(await screen.findByRole("region", { name: "Bestanden" })) };
}

test("the file tree follows the vault layout and opens entries in the side panel", async () => {
  const { user, router, tree } = await openFiles();
  expect(tree.getByRole("button", { name: "daily" })).toBeInTheDocument();

  await user.click(tree.getByRole("button", { name: "2026-09-08.md" }));
  expect(await screen.findByText("1 verwijzing")).toBeInTheDocument();
  expect(router.state.location.search).toMatchObject({ open: ["logboek/daily/2026-09-08"] });
  expect(tree.getByRole("button", { name: "2026-09-08.md" })).toHaveAttribute("aria-pressed", "true");
});

test("an attachment opens with the entries that use it", async () => {
  const { user, tree } = await openFiles();
  await user.click(tree.getByRole("button", { name: "files" }));
  await user.click(await tree.findByRole("button", { name: "2026-09-12-sprintreview.pptx" }));

  expect(await screen.findByText("Gebruikt in")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sprintreview sprint 1" })).toBeInTheDocument();
});

test("config opens the settings page and back returns to the list", async () => {
  const { user, router, tree } = await openFiles();
  await user.click(tree.getByRole("button", { name: "data" }));
  await user.click(await tree.findByRole("link", { name: "config.md" }));

  expect(await screen.findByText("Instellingen")).toBeInTheDocument();
  expect(screen.getByText("Test")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Terug" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/"));
});
