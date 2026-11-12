import { Icon } from "./Icon";

// Placeholder for the agent feature (tool calling over Jira data) we build later
const SUGGESTIONS = ["What is blocking this sprint?", "Who is overloaded?", "Draft an update for the client"];

export function AskPulse({ client }: { client: string }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Ask Pulse</h2>
        <span className="soon">Soon</span>
      </div>
      <p className="muted small">Ask anything about {client}. Pulse reads Jira to answer and changes nothing without your approval.</p>
      <div className="chips">
        {SUGGESTIONS.map((s) => <button key={s} className="chip-btn" disabled>{s}</button>)}
      </div>
      <div className="ask-input">
        <input placeholder={`Ask about ${client}`} disabled aria-label="Ask Pulse" />
        <button className="send-btn" disabled aria-label="Send"><Icon name="send" /></button>
      </div>
    </section>
  );
}
