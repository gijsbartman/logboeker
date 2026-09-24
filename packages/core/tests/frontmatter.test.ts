import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { readFrontmatter, splitFrontmatter, updateFrontmatter } from "../src";

const source = "---\ndate: 2026-09-17\n# own note\ndoelen: [a, b]\nextra: kept\n---\n\n# Title\n\nBody *text*.\n";

describe("splitFrontmatter", () => {
  test("separates yaml and body", () => {
    const split = splitFrontmatter(source);
    expect(split.yaml).toBe("date: 2026-09-17\n# own note\ndoelen: [a, b]\nextra: kept\n");
    expect(split.body).toBe("# Title\n\nBody *text*.\n");
  });

  test("no frontmatter", () => {
    expect(splitFrontmatter("# Title\n")).toMatchObject({ yaml: null, body: "# Title\n" });
  });

  test("empty frontmatter", () => {
    expect(splitFrontmatter("---\n---\nBody")).toMatchObject({ yaml: "", body: "Body" });
  });

  test("dates stay strings", () => {
    expect(readFrontmatter("date: 2026-09-17")).toEqual({ ok: true, data: { date: "2026-09-17" } });
  });
});

describe("updateFrontmatter", () => {
  test("changes one field and keeps order, comments, unknown fields and the body", () => {
    expect(updateFrontmatter(source, { doelen: ["a", "c"] })).toBe(
      "---\ndate: 2026-09-17\n# own note\ndoelen: [a, c]\nextra: kept\n---\n\n# Title\n\nBody *text*.\n",
    );
  });

  test("new lists are written inline", () => {
    expect(updateFrontmatter(source, { jira: ["SCRUM-1", "SCRUM-2"] })).toContain("jira: [SCRUM-1, SCRUM-2]\n");
  });

  test("undefined removes a field", () => {
    expect(updateFrontmatter(source, { extra: undefined })).not.toContain("extra");
  });

  test("adds frontmatter to a file without it", () => {
    expect(updateFrontmatter("# Title\n", { date: "2026-09-17" })).toBe("---\ndate: 2026-09-17\n---\n\n# Title\n");
  });

  test("round-trips arbitrary slug lists and never touches the body", () => {
    const slug = fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/);
    fc.assert(
      fc.property(fc.array(slug), fc.string(), (doelen, body) => {
        const updated = updateFrontmatter(`---\ndate: 2026-09-17\n---\n${body}`, { doelen });
        const split = splitFrontmatter(updated);
        expect(readFrontmatter(split.yaml)).toEqual({ ok: true, data: { date: "2026-09-17", doelen } });
        expect(updated.endsWith(`---\n${body}`)).toBe(true);
      }),
    );
  });
});
