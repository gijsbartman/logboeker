import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderApp } from "./render-app";

test("Ctrl+K opens search and a result opens in the side panel", async () => {
  const { user, router } = renderApp();
  await screen.findByText("5 entries");

  await user.keyboard("{Control>}k{/Control}");
  await user.type(await screen.findByPlaceholderText(/Zoek in logs/), "wrapper");
  await user.click(await screen.findByRole("option", { name: /Onboarding codebase/ }));

  expect(await screen.findByText("1 verwijzing")).toBeInTheDocument();
  expect(router.state.location.search).toMatchObject({ open: ["logboek/daily/2026-09-08"] });
});

test("results are grouped by kind and show where the match is", async () => {
  const { user } = renderApp();
  await user.click(await screen.findByRole("button", { name: /Zoeken/ }));
  await user.type(await screen.findByPlaceholderText(/Zoek in logs/), "tokenlaag");

  expect(await screen.findByRole("group", { name: "Logs" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Bewijs" })).toBeInTheDocument();
});

test("no results", async () => {
  const { user } = renderApp();
  await user.click(await screen.findByRole("button", { name: /Zoeken/ }));
  await user.type(await screen.findByPlaceholderText(/Zoek in logs/), "xyzzy");
  expect(await screen.findByText("Niets gevonden.")).toBeInTheDocument();
});
