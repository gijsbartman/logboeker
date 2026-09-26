import { createFileRoute } from "@tanstack/react-router";
import { SemesterCalendar } from "@/features/calendar/semester-calendar";

export const Route = createFileRoute("/_vault/_workspace/kalender")({
  component: SemesterCalendar,
});
