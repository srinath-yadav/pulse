import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { STATUS_KEY, STATUS_LABEL } from "../lib/status";
import type { Project } from "../types";
import { Icon } from "./Icon";

interface Props {
  projects: Project[];
  onClose: () => void;
  onNavigate: (client: string | null, issue?: string) => void;
  onToggleTheme: () => void;
}

type Item = { id: string; group: string; title: string; hint: string; status?: string; run: () => void };

export function CommandPalette({ projects, onClose, onNavigate, onToggleTheme }: Props) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (...parts: string[]) => !q || parts.some((p) => p.toLowerCase().includes(q));

    const pages: Item[] = [
      { id: "overview", group: "Go to", title: "Overview", hint: "All clients", run: () => onNavigate(null) },
      { id: "theme", group: "Go to", title: "Switch theme", hint: "Light or dark", run: onToggleTheme },
    ].filter((i) => match(i.title));

    const clients: Item[] = projects
      .filter((p) => match(p.client, p.name, p.key))
      .map((p) => ({ id: p.key, group: "Clients", title: p.client, hint: p.name, run: () => onNavigate(p.key) }));

    // Issues only appear once you type, so the list stays short
    const issues: Item[] = q
      ? projects.flatMap((p) =>
          p.issues
            .filter((i) => match(i.key, i.summary, i.assignee ?? ""))
            .map((i) => ({
              id: i.key, group: "Issues", title: i.summary, hint: `${i.key}, ${p.client}`,
              status: i.status, run: () => onNavigate(p.key, i.key),
            })),
        ).slice(0, 8)
      : [];

    return [...pages, ...clients, ...issues];
  }, [query, projects, onNavigate, onToggleTheme]);

  useEffect(() => setIndex(0), [query]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && items[index]) { items[index].run(); onClose(); }
    if (e.key === "Escape") onClose();
  }

  let lastGroup = "";
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-label="Search" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="palette-input">
          <Icon name="search" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, issues or people" aria-label="Search" />
          <span className="kbd">Esc</span>
        </div>
        <ul className="palette-list">
          {items.length === 0 && <li className="empty">Nothing matches "{query}".</li>}
          {items.map((item, i) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.group + item.id}>
                {heading && <div className="palette-group">{heading}</div>}
                <button className={`palette-item ${i === index ? "active" : ""}`}
                  onMouseEnter={() => setIndex(i)} onClick={() => { item.run(); onClose(); }}>
                  {item.status && <span className={`dot dot-${STATUS_KEY[item.status as keyof typeof STATUS_KEY]}`}
                    title={STATUS_LABEL[item.status as keyof typeof STATUS_LABEL]} />}
                  <span className="palette-title">{item.title}</span>
                  <span className="palette-hint">{item.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="palette-foot">
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> to move</span>
          <span><span className="kbd">Enter</span> to open</span>
        </div>
      </div>
    </div>
  );
}
