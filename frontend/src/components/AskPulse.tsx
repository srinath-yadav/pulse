import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import type { ToolCallLog } from "../types";
import { Icon } from "./Icon";

const SUGGESTIONS = [
  "What is blocking this project?",
  "Who is overloaded?",
  "Which client needs attention first?",
];

// Friendly names for the agent's tools, shown under each answer
const TOOL_LABELS: Record<string, string> = {
  list_clients: "listed clients",
  get_project_issues: "read issues",
  find_attention_issues: "checked blocked and stale work",
  get_workload: "checked workload",
};

type Turn =
  | { role: "user"; text: string }
  | { role: "pulse"; text: string; tools: ToolCallLog[] }
  | { role: "error"; text: string };

interface Props {
  client: string;
  projectKey: string;
}

// Render the little Markdown LLMs use anyway: **bold**. Everything else stays plain text.
function renderText(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ?
        <strong key={i}>{part.slice(2, -2)}</strong>
      : part,
    );
}

export function AskPulse({ client, projectKey }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [turns, busy]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await api.ask(q, projectKey);
      setTurns((t) => [
        ...t,
        { role: "pulse", text: res.answer, tools: res.tool_calls },
      ]);
    } catch (e) {
      const text =
        e instanceof ApiError && e.status === 503 ?
          "Ask Pulse needs an LLM. Set LLM_PROVIDER=openai_compatible in backend/.env and restart the API."
        : e instanceof ApiError && e.status === 404 ?
          "The /ask endpoint isn't running yet. Restart the backend."
        : "Pulse couldn't answer that. Try again in a moment.";
      setTurns((t) => [...t, { role: "error", text }]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <section className="card ask-card">
      <div className="card-head">
        <h2 className="ai-title">
          <Icon name="sparkle" /> Ask Pulse
        </h2>
        {turns.length > 0 && (
          <button
            className="link-btn"
            onClick={() => setTurns([])}
            disabled={busy}>
            Clear
          </button>
        )}
      </div>

      {turns.length === 0 ?
        <>
          <p className="muted small">
            Ask anything about {client} or your other clients. Pulse looks it up
            in Jira and changes nothing.
          </p>
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chip-btn"
                onClick={() => send(s)}
                disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        </>
      : <div className="thread" aria-live="polite">
          {turns.map((t, i) => (
            <div key={i} className={`bubble bubble-${t.role}`}>
              <p>{renderText(t.text)}</p>
              {t.role === "pulse" && t.tools.length > 0 && (
                <p className="trace">
                  {[
                    ...new Set(
                      t.tools.map((c) => TOOL_LABELS[c.name] ?? c.name),
                    ),
                  ].join(", ")}
                </p>
              )}
            </div>
          ))}
          {busy && (
            <div className="bubble bubble-pulse">
              <p className="muted thinking">
                Looking it up<span>.</span>
                <span>.</span>
                <span>.</span>
              </p>
            </div>
          )}
          <div ref={endRef} />
        </div>
      }

      <form className="ask-input" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${client}`}
          aria-label="Ask Pulse"
          maxLength={500}
          disabled={busy}
        />
        <button
          className="send-btn"
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send">
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}
