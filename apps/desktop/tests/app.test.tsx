import { screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderApp } from "./render-app";

test("lists every entry, newest first", async () => {
  renderApp();
  expect(await screen.findByText("5 entries")).toBeInTheDocument();
  expect(screen.getByText("Check-in met label op de verkeerde plek")).toBeInTheDocument();
  expect(screen.getByText("Onboarding codebase en eerste interop-verkenning")).toBeInTheDocument();
});

test("a skill filter narrows the list and lives in the URL", async () => {
  const { router, user } = renderApp();
  const filters = await screen.findByRole("region", { name: "Filters" });
  await user.click(within(filters).getByRole("button", { name: "Kritisch oordelen" }));

  expect(await screen.findByText("2 van 5")).toBeInTheDocument();
  expect(router.state.location.search).toMatchObject({ vaardigheid: ["kritisch-oordelen"] });
});

test("filters restore from the URL", async () => {
  renderApp('/?soort=["bewijs"]');
  expect(await screen.findByText("2 van 5")).toBeInTheDocument();
});

test("a reference opens its target in the side panel", async () => {
  const { user } = renderApp();
  await user.click(await screen.findByRole("button", { name: "@2026-09-09" }));

  expect(await screen.findByText("1 verwijzing")).toBeInTheDocument();
  expect(screen.getAllByText("Tokenlaag afgestemd met UI/UX")).toHaveLength(2);
});

test("unresolved references and missing attachments are flagged", async () => {
  renderApp();
  expect(await screen.findByText("@onbekend")).toHaveAttribute("title", "Verwijzing niet gevonden");
  expect(screen.getByText("ontbreekt")).toBeInTheDocument();
});

test("grouping by goal adds a group for entries without one", async () => {
  const { user } = renderApp();
  await user.click(await screen.findByRole("switch"));
  expect(await screen.findByRole("heading", { level: 2, name: /Zonder doel/ })).toBeInTheDocument();
});
