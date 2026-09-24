import { vaultState } from "./vault-mock";
import { createMemoryFs } from "@logboeker/vault";
import { screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { renderApp } from "./render-app";

const state = vaultState;

beforeEach(() => state.reset());

test("without a vault the welcome screen is shown", async () => {
  const { router } = renderApp();
  expect(await screen.findByText("Bestaand logboek openen")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/welkom");
});

test("opening a folder that is not a vault says what is missing", async () => {
  state.disks.set("/notes", createMemoryFs({ "data/config.md": "---\n---\n" }));
  state.picked = "/notes";
  const { user } = renderApp();

  await user.click(await screen.findByRole("button", { name: "Map kiezen" }));
  expect(await screen.findByText("Dit is geen logboek")).toBeInTheDocument();
  expect(screen.getByText("logboek/daily")).toBeInTheDocument();
  expect(screen.getByText("logboek/evidence")).toBeInTheDocument();
});

test("cancelling the folder dialog keeps you on the welcome screen", async () => {
  const { user, router } = renderApp();
  await user.click(await screen.findByRole("button", { name: "Map kiezen" }));
  expect(router.state.location.pathname).toBe("/welkom");
});

test("the new vault form validates before asking for a folder", async () => {
  const { user } = renderApp();
  await user.click(await screen.findByRole("button", { name: "Map kiezen en aanmaken" }));
  expect(await screen.findByText("Vul je naam in")).toBeInTheDocument();
  expect(screen.getByText("Kies de eerste dag van het semester")).toBeInTheDocument();
});

test("creating a vault scaffolds it and opens it", async () => {
  const disk = createMemoryFs({});
  state.disks.set("/semester", disk);
  state.picked = "/semester";
  const { user, router } = renderApp();

  await user.type(await screen.findByLabelText("Naam"), "Gijs");
  await user.type(screen.getByLabelText("Project"), "USPSimGame");
  await user.type(screen.getByLabelText("Semesterstart"), "2026-09-07");
  await user.click(screen.getByRole("button", { name: "Map kiezen en aanmaken" }));

  expect(await screen.findByText("Nog geen entries")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/");
  expect(await disk.readText("data/config.md")).toContain("projectnaam: USPSimGame");
});
