import {
  ROADMAP_ID,
  semesterWeeks,
  sprintWeek,
  type Config,
  type DoelVoortgang,
  type Entry,
  type MijlpaalVoortgang,
  type SemesterWeek,
} from "@logboeker/core";
import { CalendarOff, Diamond, Plus, TriangleAlert } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  isFiltering,
  matchesDoel,
  matchesFilters,
  matchesMijlpaal,
} from "@/features/filters/search";
import { useFilters } from "@/features/filters/use-filters";
import { useReferences } from "@/features/references/use-references";
import { formatDate, formatShortDate } from "@/lib/format";
import { useVault } from "@/lib/vault";
import {
  DOEL_STATUS,
  doelRef,
  mijlpaalLabel,
  mijlpaalRef,
  today,
  useRoadmap,
} from "./use-roadmap";
import { DoelDialog, MijlpaalDialog } from "./roadmap-forms";
import "./calendar.css";

const DAYS = ["Ma", "Di", "Wo", "Do", "Vr"];
const DAY_MS = 86_400_000;

interface Day {
  logs: Entry[];
  bewijs: Entry[];
  mijlpalen: MijlpaalVoortgang[];
}

function addDays(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

// Weekend items land on Friday, so every workweek stays five columns wide.
function layout(
  weeks: SemesterWeek[],
  entries: Entry[],
  mijlpalen: MijlpaalVoortgang[],
  config: Config,
) {
  const days = new Map(
    weeks.map((w) => [
      w.week,
      DAYS.map((): Day => ({ logs: [], bewijs: [], mijlpalen: [] })),
    ]),
  );
  const place = (date: string, add: (day: Day) => void) => {
    const week = sprintWeek(date, config)?.week;
    const start = weeks.find((w) => w.week === week)?.start;
    if (!week || !start) return;
    const column = Math.min((Date.parse(date) - Date.parse(start)) / DAY_MS, 4);
    add(days.get(week)![column]!);
  };

  for (const entry of entries) {
    if (entry.date)
      place(entry.date, (day) =>
        (entry.kind === "log" ? day.logs : day.bewijs).push(entry),
      );
  }
  for (const m of mijlpalen)
    place(m.mijlpaal.datum, (day) => day.mijlpalen.push(m));
  return days;
}

function LaneCell({ lane, week }: { lane: DoelVoortgang; week: SemesterWeek }) {
  const { show } = useReferences();
  const planned = week.end >= lane.doel.van && week.start <= lane.doel.tot;
  const active = lane.actieveWeken.has(week.week);
  if (!planned && !active) return <span className="calendar-lane" />;

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      className="calendar-lane"
      data-planned={planned || undefined}
      data-active={active || undefined}
      data-status={lane.status}
      data-start={week.start <= lane.doel.van || undefined}
      data-end={week.end >= lane.doel.tot || undefined}
      onClick={() => show(doelRef(lane.doel.slug))}
    />
  );
}

export function SemesterCalendar() {
  const { config, entries, diagnostics } = useVault();
  const [dialog, setDialog] = useState<
    { kind: "doel"; slug?: string } | { kind: "mijlpaal" } | null
  >(null);
  const roadmap = useRoadmap();
  const { search } = useFilters();
  const { show } = useReferences();
  const now = today();
  const weeks = semesterWeeks(config);

  if (weeks.length === 0) {
    return (
      <div className="journal-pane">
        <Empty className="journal-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarOff />
            </EmptyMedia>
            <EmptyTitle>Geen semesterstart</EmptyTitle>
            <EmptyDescription>
              Zet semesterstart in data/config.md om de kalender te tonen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const problems = diagnostics.filter((d) => d.entryId === ROADMAP_ID);
  const closeDialog = (open: boolean) => !open && setDialog(null);
  const days = layout(weeks, entries, roadmap.mijlpalen, config);
  const current = sprintWeek(now, config);
  const filtering = isFiltering(search);
  const dim = (matches: boolean) => (filtering && !matches) || undefined;
  const behaald = roadmap.mijlpalen.filter(
    (m) => m.status === "behaald",
  ).length;
  const afgerond = roadmap.doelen.filter((d) => d.status === "afgerond").length;
  const sprints = [...new Set(weeks.map((w) => w.sprint))];

  return (
    <div className="journal-pane">
      <ScrollArea className="h-full">
        <div className="journal-page">
          <section
            className="journal-masthead"
            aria-labelledby="calendar-title"
          >
            <div className="journal-intro">
              <h1 id="calendar-title">Roadmap</h1>
            </div>
            <dl className="journal-stats">
              <div>
                <dt>Mijlpalen behaald</dt>
                <dd>
                  {String(behaald).padStart(2, "0")}
                  <small>/{roadmap.mijlpalen.length}</small>
                </dd>
              </div>
              <div>
                <dt>Doelen afgerond</dt>
                <dd>
                  {String(afgerond).padStart(2, "0")}
                  <small>/{roadmap.doelen.length}</small>
                </dd>
              </div>
              <div>
                <dt>{current ? `Week, sprint ${current.sprint}` : "Week"}</dt>
                <dd>
                  {current ? String(current.week).padStart(2, "0") : "–"}
                  <small>/{weeks.length}</small>
                </dd>
              </div>
            </dl>
          </section>

          {problems.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <TriangleAlert />
              <AlertTitle>
                {problems.length === 1
                  ? "1 probleem"
                  : `${problems.length} problemen`}{" "}
                in logboek/roadmap.md
              </AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {problems.map((problem, i) => (
                    <li key={i}>{problem.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="calendar-toolbar">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog({ kind: "doel" })}
            >
              <Plus /> Doel inplannen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog({ kind: "mijlpaal" })}
            >
              <Plus /> Mijlpaal toevoegen
            </Button>
          </div>

          <div
            className="calendar"
            style={
              roadmap.doelen.length > 0
                ? ({
                    "--lane-columns": `repeat(${roadmap.doelen.length}, 16px)`,
                  } as CSSProperties)
                : undefined
            }
          >
            <div className="calendar-head">
              <span />
              {DAYS.map((day) => (
                <span key={day} className="calendar-dayname">
                  {day}
                </span>
              ))}
              {roadmap.doelen.map((lane) => (
                <button
                  key={lane.doel.slug}
                  type="button"
                  className="calendar-lane-label"
                  data-status={lane.status}
                  data-dim={dim(matchesDoel(lane.doel, search))}
                  aria-label={`Doel ${lane.doel.titel}, ${DOEL_STATUS[lane.status]}`}
                  title={lane.doel.titel}
                  onClick={() => show(doelRef(lane.doel.slug))}
                >
                  {lane.doel.titel}
                </button>
              ))}
            </div>

            {sprints.map((sprint) => (
              <section key={sprint} aria-label={`Sprint ${sprint}`}>
                <h2 className="calendar-sprint">Sprint {sprint}</h2>
                {weeks
                  .filter((w) => w.sprint === sprint)
                  .map((week) => (
                    <div
                      key={week.week}
                      role="group"
                      aria-label={`Week ${week.week}, ${formatShortDate(week.start)} tot ${formatShortDate(week.end)}`}
                      className="calendar-week"
                      data-current={week.week === current?.week || undefined}
                    >
                      <div className="calendar-weeklabel">
                        <span>wk {week.week}</span>
                        <small>{formatShortDate(week.start)}</small>
                      </div>
                      {days.get(week.week)!.map((day, i) => {
                        const date = addDays(week.start, i);
                        const missed =
                          day.logs.length === 0 &&
                          date < now &&
                          date >= config.semesterstart!;
                        return (
                          <div
                            key={date}
                            className="calendar-day"
                            data-today={date === now || undefined}
                            data-missed={missed || undefined}
                          >
                            <span className="calendar-date">
                              <span className="calendar-date-name">
                                {DAYS[i]}{" "}
                              </span>
                              {formatShortDate(date)}
                            </span>
                            {day.logs.map((entry) => (
                              <button
                                key={entry.id}
                                type="button"
                                className="calendar-log"
                                data-dim={dim(matchesFilters(entry, search))}
                                aria-label={`Daglog ${formatDate(date)}: ${entry.title}`}
                                title={entry.title}
                                onClick={() => show(entry.id)}
                              >
                                <span className="calendar-dot" />
                                <span>{entry.title}</span>
                              </button>
                            ))}
                            {day.mijlpalen.map((m) => (
                              <button
                                key={m.mijlpaal.index}
                                type="button"
                                className="calendar-milestone"
                                data-status={m.status}
                                data-evidence={m.bewijsAanwezig || undefined}
                                data-dim={dim(
                                  matchesMijlpaal(m.mijlpaal, search),
                                )}
                                aria-label={`Mijlpaal ${m.mijlpaal.titel}, ${mijlpaalLabel(m)}`}
                                title={m.mijlpaal.titel}
                                onClick={() =>
                                  show(mijlpaalRef(m.mijlpaal.index))
                                }
                              >
                                <Diamond aria-hidden="true" />
                                <span>{m.mijlpaal.titel}</span>
                              </button>
                            ))}
                            {day.bewijs.map((entry) => (
                              <button
                                key={entry.id}
                                type="button"
                                className="calendar-evidence"
                                data-dim={dim(matchesFilters(entry, search))}
                                aria-label={`Bewijsstuk ${entry.title}`}
                                title={entry.title}
                                onClick={() => show(entry.id)}
                              >
                                <span>{entry.title}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                      {roadmap.doelen.map((lane) => (
                        <LaneCell
                          key={lane.doel.slug}
                          lane={lane}
                          week={week}
                        />
                      ))}
                    </div>
                  ))}
              </section>
            ))}
          </div>

          <ul className="calendar-legend" aria-label="Legenda">
            <li>
              <span className="calendar-dot" /> Daglog
            </li>
            <li>
              <span className="calendar-day" data-missed /> Werkdag zonder log
            </li>
            <li>
              <Diamond className="calendar-legend-behaald" /> Mijlpaal behaald
            </li>
            <li>
              <Diamond /> Mijlpaal open
            </li>
            <li>
              <Diamond className="calendar-legend-verlopen" /> Mijlpaal verlopen
            </li>
            {roadmap.doelen.length > 0 && (
              <li>
                <span className="calendar-lane" data-planned data-active />{" "}
                Doel, week met activiteit
              </li>
            )}
          </ul>

          {roadmap.ongepland.length > 0 && (
            <section
              className="calendar-unplanned"
              aria-labelledby="unplanned-title"
            >
              <h2 id="unplanned-title">Niet ingepland</h2>
              <p>
                Doelen uit je entries die nog geen periode hebben. Kies er een
                om hem in te plannen.
              </p>
              <ul>
                {roadmap.ongepland.map((slug) => (
                  <li key={slug}>
                    <button
                      type="button"
                      aria-label={`${slug} inplannen`}
                      onClick={() => setDialog({ kind: "doel", slug })}
                    >
                      <Plus aria-hidden="true" />
                      {slug}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <DoelDialog
            open={dialog?.kind === "doel"}
            onOpenChange={closeDialog}
            slug={dialog?.kind === "doel" ? dialog.slug : undefined}
          />
          <MijlpaalDialog
            open={dialog?.kind === "mijlpaal"}
            onOpenChange={closeDialog}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
