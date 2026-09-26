import {
  ROADMAP_ID,
  semesterWeeks,
  sprintWeek,
  type Config,
  type Entry,
  type ItemVoortgang,
  type SemesterWeek,
} from "@logboeker/core";
import { CalendarOff, Diamond, Plus, TriangleAlert } from "lucide-react";
import { type CSSProperties } from "react";
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
  matchesFilters,
  matchesItem,
} from "@/features/filters/search";
import { useFilters } from "@/features/filters/use-filters";
import { useReferences } from "@/features/references/use-references";
import { formatDate, formatShortDate, humanise } from "@/lib/format";
import { useVault } from "@/lib/vault";
import {
  itemLabel,
  itemPeriod,
  itemRef,
  today,
  useCreateItem,
  useRoadmap,
} from "./use-roadmap";
import "./calendar.css";

const DAYS = ["Ma", "Di", "Wo", "Do", "Vr"];
const DAY_MS = 86_400_000;

interface Day {
  logs: Entry[];
  bewijs: Entry[];
  items: ItemVoortgang[];
}

interface Bar {
  voortgang: ItemVoortgang;
  from: number;
  to: number;
  lane: number;
  before: boolean;
  after: boolean;
}

const daysBetween = (from: string, to: string) =>
  (Date.parse(to) - Date.parse(from)) / DAY_MS;

function addDays(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

// Weekend items land on Friday, so every workweek stays five columns wide.
function layoutDays(
  weeks: SemesterWeek[],
  entries: Entry[],
  items: ItemVoortgang[],
  config: Config,
) {
  const days = new Map(
    weeks.map((w) => [
      w.week,
      DAYS.map((): Day => ({ logs: [], bewijs: [], items: [] })),
    ]),
  );
  const place = (date: string, add: (day: Day) => void) => {
    const week = sprintWeek(date, config)?.week;
    const start = weeks.find((w) => w.week === week)?.start;
    if (!week || !start) return;
    add(days.get(week)![Math.min(daysBetween(start, date), 4)]!);
  };

  for (const entry of entries) {
    if (entry.date)
      place(entry.date, (day) =>
        (entry.kind === "log" ? day.logs : day.bewijs).push(entry),
      );
  }
  for (const v of items) {
    if (!v.item.meerdaags) place(v.item.start, (day) => day.items.push(v));
  }
  return days;
}

// Multi-day items are cut at the week's edges and stacked in lanes, like
// all-day events in a calendar app.
function layoutBars(week: SemesterWeek, items: ItemVoortgang[]): Bar[] {
  const segments = items
    .filter(
      ({ item }) =>
        item.meerdaags && item.start <= week.end && item.eind >= week.start,
    )
    .map((voortgang) => {
      const { start, eind } = voortgang.item;
      return {
        voortgang,
        from: daysBetween(week.start, start > week.start ? start : week.start),
        to: daysBetween(week.start, eind < week.end ? eind : week.end),
        // Square edges only where the bar continues in a neighbouring week;
        // a weekend on either side is not drawn, so the edge stays round.
        before: start <= addDays(week.start, -3),
        after: eind >= addDays(week.start, 7),
      };
    })
    .sort((a, b) => a.from - b.from || b.to - a.to);

  const laneEnds: number[] = [];
  return segments.map((segment) => {
    let lane = laneEnds.findIndex((end) => end < segment.from);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = segment.to;
    return { ...segment, lane };
  });
}

export function SemesterCalendar() {
  const { config, entries, diagnostics } = useVault();
  const create = useCreateItem();
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
  const days = layoutDays(weeks, entries, roadmap.items, config);
  const current = sprintWeek(now, config);
  const filtering = isFiltering(search);
  const dim = (matches: boolean) => (filtering && !matches) || undefined;
  const count = (status: ItemVoortgang["status"]) =>
    roadmap.items.filter((v) => v.status === status).length;
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
                <dt>Afgerond</dt>
                <dd>
                  {String(count("afgerond")).padStart(2, "0")}
                  <small>/{roadmap.items.length}</small>
                </dd>
              </div>
              <div>
                <dt>Verlopen</dt>
                <dd>{String(count("verlopen")).padStart(2, "0")}</dd>
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
              onClick={() => create({ titel: "Nieuw item", datum: now })}
            >
              <Plus /> Nieuw item
            </Button>
            <span>of dubbelklik op een dag</span>
          </div>

          <div className="calendar">
            <div className="calendar-head">
              <span />
              {DAYS.map((day) => (
                <span key={day} className="calendar-dayname">
                  {day}
                </span>
              ))}
            </div>

            {sprints.map((sprint) => (
              <section key={sprint} aria-label={`Sprint ${sprint}`}>
                <h2 className="calendar-sprint">Sprint {sprint}</h2>
                {weeks
                  .filter((w) => w.sprint === sprint)
                  .map((week) => {
                    const bars = layoutBars(week, roadmap.items);
                    return (
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
                        {bars.length > 0 && (
                          <div className="calendar-band">
                            {bars.map((bar) => (
                              <button
                                key={bar.voortgang.item.index}
                                type="button"
                                className="calendar-bar"
                                data-status={bar.voortgang.status}
                                data-before={bar.before || undefined}
                                data-after={bar.after || undefined}
                                data-dim={dim(
                                  matchesItem(bar.voortgang.item, search),
                                )}
                                style={{
                                  gridColumn: `${bar.from + 1} / ${bar.to + 2}`,
                                  gridRow: bar.lane + 1,
                                }}
                                aria-label={`${bar.voortgang.item.titel}, ${itemPeriod(bar.voortgang)}, ${itemLabel(bar.voortgang)}`}
                                title={bar.voortgang.item.titel}
                                onClick={() =>
                                  show(itemRef(bar.voortgang.item.index))
                                }
                              >
                                <span>{bar.voortgang.item.titel}</span>
                              </button>
                            ))}
                          </div>
                        )}
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
                              style={{ "--day": i + 2 } as CSSProperties}
                              data-today={date === now || undefined}
                              data-missed={missed || undefined}
                              onDoubleClick={(event) => {
                                if (
                                  !(event.target as HTMLElement).closest(
                                    "button",
                                  )
                                )
                                  create({ titel: "Nieuw item", datum: date });
                              }}
                            >
                              <span className="calendar-date">
                                <span className="calendar-date-name">
                                  {DAYS[i]}{" "}
                                </span>
                                {formatShortDate(date)}
                              </span>
                              <div className="calendar-day-content">
                                {day.logs.map((entry) => (
                                  <button
                                    key={entry.id}
                                    type="button"
                                    className="calendar-log"
                                    data-dim={dim(
                                      matchesFilters(entry, search),
                                    )}
                                    aria-label={`Daglog ${formatDate(date)}: ${entry.title}`}
                                    title={entry.title}
                                    onClick={() => show(entry.id)}
                                  >
                                    <span className="calendar-dot" />
                                    <span>{entry.title}</span>
                                  </button>
                                ))}
                                {day.items.map((v) => (
                                  <button
                                    key={v.item.index}
                                    type="button"
                                    className="calendar-item"
                                    data-status={v.status}
                                    data-evidence={
                                      v.bewijsAanwezig || undefined
                                    }
                                    data-dim={dim(matchesItem(v.item, search))}
                                    aria-label={`${v.item.titel}, ${itemLabel(v)}`}
                                    title={v.item.titel}
                                    onClick={() => show(itemRef(v.item.index))}
                                  >
                                    <Diamond aria-hidden="true" />
                                    <span>{v.item.titel}</span>
                                  </button>
                                ))}
                                {day.bewijs.map((entry) => (
                                  <button
                                    key={entry.id}
                                    type="button"
                                    className="calendar-evidence"
                                    data-dim={dim(
                                      matchesFilters(entry, search),
                                    )}
                                    aria-label={`Bewijsstuk ${entry.title}`}
                                    title={entry.title}
                                    onClick={() => show(entry.id)}
                                  >
                                    <span>{entry.title}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
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
              <Diamond /> Item
            </li>
            <li>
              <Diamond className="calendar-legend-afgerond" /> Afgerond
            </li>
            <li>
              <Diamond className="calendar-legend-verlopen" /> Verlopen
            </li>
            <li>
              <span className="calendar-bar calendar-legend-bar" /> Meerdaags
              item
            </li>
          </ul>

          {roadmap.ongepland.length > 0 && (
            <section
              className="calendar-unplanned"
              aria-labelledby="unplanned-title"
            >
              <h2 id="unplanned-title">Niet ingepland</h2>
              <p>
                Doelen uit je entries die nog niet op de roadmap staan. Kies er
                een om hem in te plannen.
              </p>
              <ul>
                {roadmap.ongepland.map((slug) => (
                  <li key={slug}>
                    <button
                      type="button"
                      aria-label={`${slug} inplannen`}
                      onClick={() =>
                        create({
                          titel: humanise(slug),
                          datum: now,
                          tot: addDays(now, 7),
                          doel: slug,
                        })
                      }
                    >
                      <Plus aria-hidden="true" />
                      {slug}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
