"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  mSeedDemo,
  mToggleScheduledTask,
  qListActivities,
  qListScheduledTasks,
  qSearchAll,
} from "@/lib/convexApi";

type Tab = "activity" | "calendar" | "search";

type ActivityItem = {
  _id: string;
  ts: number;
  kind: string;
  status: string;
  module: string;
  summary: string;
  sourceRef: string;
  raw: unknown;
};

type ListActivitiesResult = {
  items: ActivityItem[];
  nextCursor: string | null;
};

type ScheduledTask = {
  _id: string;
  title: string;
  module: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
  durationMinutes: number;
  active: boolean;
};

type SearchResult = {
  activities: ActivityItem[];
  documents: Array<{ _id: string; title: string; module: string; snippet: string }>;
  tasks: ScheduledTask[];
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "activity", label: "Activity" },
  { id: "calendar", label: "Calendar" },
  { id: "search", label: "Search" },
];

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString();
}

function startOfWeekIso(date: Date): string {
  const copy = new Date(date);
  const diff = copy.getDate() - copy.getDay();
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

export function DashboardClient() {
  const [tab, setTab] = useState<Tab>("activity");
  const [cursor, setCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const activities = useQuery(qListActivities, {
    limit: 20,
    cursor,
  }) as ListActivitiesResult | undefined;

  const weekStart = useMemo(() => startOfWeekIso(new Date()), []);
  const scheduledTasks =
    (useQuery(qListScheduledTasks, { weekStart }) as ScheduledTask[] | undefined) ?? [];

  const searchResults =
    (useQuery(
      qSearchAll,
      searchTerm.trim().length > 0
        ? {
            term: searchTerm,
            limit: 20,
          }
        : "skip",
    ) as SearchResult | undefined) ?? {
      activities: [],
      documents: [],
      tasks: [],
    };

  const seedDemo = useMutation(mSeedDemo);
  const toggleTask = useMutation(mToggleScheduledTask);

  const allItems = activities?.items ?? [];
  const statusOptions = useMemo(
    () => ["all", ...new Set(allItems.map((item) => item.status))],
    [allItems],
  );
  const kindOptions = useMemo(
    () => ["all", ...new Set(allItems.map((item) => item.kind))],
    [allItems],
  );
  const moduleOptions = useMemo(
    () => ["all", ...new Set(allItems.map((item) => item.module))],
    [allItems],
  );

  const filteredItems = allItems.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    if (moduleFilter !== "all" && item.module !== moduleFilter) return false;
    return true;
  });

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h1>Dashboard</h1>
        </div>
        <button
          className="button"
          onClick={() => {
            void seedDemo({});
          }}
          type="button"
        >
          Seed Demo Data
        </button>
      </header>

      {!process.env.NEXT_PUBLIC_CONVEX_URL ? (
        <p className="warning">
          Set `NEXT_PUBLIC_CONVEX_URL` to enable live Convex data.
        </p>
      ) : null}

      <nav className="tabs" aria-label="Dashboard sections">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            className={tab === tabItem.id ? "tab active" : "tab"}
            onClick={() => setTab(tabItem.id)}
            type="button"
          >
            {tabItem.label}
          </button>
        ))}
      </nav>

      {tab === "activity" ? (
        <section className="section-card">
          <div className="chip-row">
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kind
              <select
                value={kindFilter}
                onChange={(event) => setKindFilter(event.target.value)}
              >
                {kindOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Module
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
              >
                {moduleOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ul className="activity-list">
            {filteredItems.map((item) => (
              <li key={item._id} className="activity-item">
                <button type="button" onClick={() => setSelected(item)}>
                  <div>
                    <p className="event-title">{item.summary}</p>
                    <p className="event-meta">
                      {item.module} · {item.kind} · {item.status}
                    </p>
                  </div>
                  <time>{formatTs(item.ts)}</time>
                </button>
              </li>
            ))}
          </ul>

          <div className="footer-row">
            <button
              className="button secondary"
              disabled={!activities?.nextCursor}
              onClick={() => setCursor(activities?.nextCursor ?? null)}
              type="button"
            >
              Load more
            </button>
          </div>

          {selected ? (
            <aside className="drawer" role="dialog" aria-modal="true">
              <div className="drawer-head">
                <h2>Activity Detail</h2>
                <button type="button" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
              <pre>{JSON.stringify(selected.raw, null, 2)}</pre>
            </aside>
          ) : null}
        </section>
      ) : null}

      {tab === "calendar" ? (
        <section className="section-card">
          <div className="calendar-grid">
            {weekdays.map((day, idx) => (
              <div key={day} className="calendar-col">
                <h3>{day}</h3>
                <ul>
                  {scheduledTasks
                    .filter((task) => task.dayOfWeek === idx)
                    .map((task) => (
                      <li key={task._id} className={task.active ? "task" : "task disabled"}>
                        <p>{task.title}</p>
                        <p className="event-meta">
                          {String(task.hour).padStart(2, "0")}:
                          {String(task.minute).padStart(2, "0")} · {task.module}
                        </p>
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => {
                            void toggleTask({ id: task._id, active: !task.active });
                          }}
                        >
                          {task.active ? "Disable" : "Enable"}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "search" ? (
        <section className="section-card">
          <div className="search-head">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search activity, docs, tasks"
            />
          </div>

          <div className="search-groups">
            <div>
              <h3>Activities</h3>
              <ul>
                {searchResults.activities.map((item) => (
                  <li key={item._id}>
                    {item.summary} <span className="event-meta">({item.module})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Documents</h3>
              <ul>
                {searchResults.documents.map((doc) => (
                  <li key={doc._id}>
                    {doc.title} <span className="event-meta">({doc.module})</span>
                    <p className="event-meta">{doc.snippet}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Tasks</h3>
              <ul>
                {searchResults.tasks.map((task) => (
                  <li key={task._id}>
                    {task.title} <span className="event-meta">({task.module})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
