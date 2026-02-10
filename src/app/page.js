"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "classnames";

const STORAGE_KEY = "pocket-shelf-items";
const PREF_KEY = "pocket-shelf-prefs";

const defaultPrefs = {
  sort: "recent",
  filter: "all"
};

const emptyForm = {
  title: "",
  author: "",
  link: "",
  notes: ""
};

function useReadingList() {
  const [items, setItems] = useState([]);
  const [prefs, setPrefs] = useState(defaultPrefs);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const storedPrefs = typeof window !== "undefined" ? window.localStorage.getItem(PREF_KEY) : null;

    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (storedPrefs) {
      try {
        setPrefs((prev) => ({ ...prev, ...JSON.parse(storedPrefs) }));
      } catch {
        window.localStorage.removeItem(PREF_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const addItem = (item) => {
    setItems((prev) => [
      {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: "backlog"
      },
      ...prev
    ]);
  };

  const updateStatus = (id, status) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleFavorite = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              favorite: !item.favorite
            }
          : item
      )
    );
  };

  return { items, addItem, updateStatus, removeItem, toggleFavorite, prefs, setPrefs };
}

function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(() => {
        // ignore registration errors
      });
  }
}

const statusLabels = {
  backlog: "Plan",
  reading: "Reading",
  completed: "Finished"
};

export default function Page() {
  const { items, addItem, updateStatus, removeItem, toggleFavorite, prefs, setPrefs } = useReadingList();
  const [formState, setFormState] = useState(emptyForm);
  const [search, setSearch] = useState("");

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedTitle = formState.title.trim();
    if (!trimmedTitle) return;
    addItem({
      ...formState,
      title: trimmedTitle,
      author: formState.author.trim(),
      link: formState.link.trim(),
      notes: formState.notes.trim()
    });
    setFormState(emptyForm);
  };

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const statusFilter = prefs.filter;
    const sorted = [...items].sort((a, b) => {
      if (prefs.sort === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (prefs.sort === "alpha") {
        return a.title.localeCompare(b.title);
      }
      if (prefs.sort === "favorite") {
        return Number(b.favorite ?? false) - Number(a.favorite ?? false);
      }
      return 0;
    });

    return sorted.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.author.toLowerCase().includes(term) ||
        item.notes.toLowerCase().includes(term)
      );
    });
  }, [items, prefs.filter, prefs.sort, search]);

  return (
    <main className="screen-dvh mx-auto flex w-full max-w-xl flex-col px-4 pb-24 pt-12 sm:px-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Pocket Shelf</h1>
          <span className="rounded-full bg-blue-500/15 px-4 py-1 text-xs font-medium uppercase tracking-wider text-blue-300">
            Offline Ready
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-300">
          Collect articles and books to read on the go. Everything stays synced locally so it works without
          connection.
        </p>
      </header>

      <section className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-blue-500/10 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium text-slate-200">
              Title *
            </label>
            <input
              id="title"
              required
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Atomic Habits"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none ring-2 ring-transparent transition focus:border-blue-500/40 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="author" className="text-sm font-medium text-slate-200">
              Author
            </label>
            <input
              id="author"
              value={formState.author}
              onChange={(event) => setFormState((prev) => ({ ...prev, author: event.target.value }))}
              placeholder="James Clear"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none ring-2 ring-transparent transition focus:border-blue-500/40 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="link" className="text-sm font-medium text-slate-200">
              Link
            </label>
            <input
              id="link"
              value={formState.link}
              onChange={(event) => setFormState((prev) => ({ ...prev, link: event.target.value }))}
              placeholder="https://"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none ring-2 ring-transparent transition focus:border-blue-500/40 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-slate-200">
              Notes
            </label>
            <textarea
              id="notes"
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              placeholder="Quick summary, why it matters, reminders..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none ring-2 ring-transparent transition focus:border-blue-500/40 focus:ring-blue-500/30"
            />
          </div>
          <button
            type="submit"
            className="mt-2 flex h-12 items-center justify-center rounded-2xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-200 active:translate-y-[1px]"
          >
            Save to Shelf
          </button>
        </form>
      </section>

      <section className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[
              { id: "all", label: "All" },
              { id: "backlog", label: "Plan" },
              { id: "reading", label: "Reading" },
              { id: "completed", label: "Finished" }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setPrefs((prev) => ({ ...prev, filter: option.id }))}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                  prefs.filter === option.id
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 items-center gap-3 sm:justify-end">
            <select
              value={prefs.sort}
              onChange={(event) => setPrefs((prev) => ({ ...prev, sort: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="recent">Newest first</option>
              <option value="favorite">Favorites first</option>
              <option value="alpha">A → Z</option>
            </select>
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your shelf"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none ring-2 ring-transparent focus:border-blue-500/40 focus:ring-blue-500/30"
              />
              <span className="pointer-events-none absolute right-3 top-2.5 text-xs uppercase tracking-wide text-slate-500">
                {filteredItems.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 space-y-3 overflow-y-auto pb-6">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
            Add a title to get started. Items stay on this device and can be read offline anytime.
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="group rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/40 transition hover:border-blue-500/40 hover:bg-slate-900/80"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  {item.author && <p className="text-xs uppercase tracking-wide text-slate-400">{item.author}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      {statusLabels[item.status]}
                    </span>
                    {item.favorite && <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-200">Favorite</span>}
                    <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className={clsx(
                      "rounded-full p-2 text-sm transition",
                      item.favorite ? "bg-blue-500/30 text-blue-200" : "bg-white/5 text-slate-300 hover:bg-white/10"
                    )}
                    aria-label="Toggle favorite"
                  >
                    {item.favorite ? "★" : "☆"}
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded-full bg-white/5 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-red-500/20 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {item.notes && <p className="whitespace-pre-line text-sm text-slate-200">{item.notes}</p>}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-300 underline-offset-4 hover:underline"
                >
                  Open link ↗
                </a>
              )}

              <div className="mt-6 flex gap-2">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(item.id, status)}
                    className={clsx(
                      "flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                      item.status === status
                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/40"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
