import { z } from "zod";

// An empty YAML field (`doelen:`) parses as null.
const list = z.preprocess(
  (value) => (value == null ? [] : value),
  z.array(z.coerce.string().trim()).transform((items) => items.filter(Boolean)),
);

const isoDate = z.iso.date();

export const frontmatterSchema = z.looseObject({
  date: isoDate.optional(),
  titel: z.string().optional(),
  portflow_naam: z.string().optional(),
  vaardigheden: list,
  beroepstaken: list,
  doelen: list,
  bestanden: list,
  jira: list,
  evidence: list,
  retroactief: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const configSchema = z.looseObject({
  student_naam: z.string().optional(),
  projectnaam: z.string().optional(),
  rol: z.string().optional(),
  semesterstart: isoDate.optional(),
  sprintlengte_weken: z.number().int().positive().default(2),
  code_repo: z.string().optional(),
  tracker: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;
