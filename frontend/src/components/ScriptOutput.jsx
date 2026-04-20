import React from "react";

export default function ScriptOutput({ script, copied, onCopy, outputRef }) {
  if (!script) return null;

  return (
    <section className="card output-card" ref={outputRef}>
      <div className="section-header">
        <h2 className="section-label">Generated Script</h2>
        <button className="btn" onClick={onCopy}>
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      <pre className="script-output">{script}</pre>
      <p className="script-hint">
        Paste this into ServiceNow: <strong>System Definition › Scripts – Background</strong>
      </p>
    </section>
  );
}
