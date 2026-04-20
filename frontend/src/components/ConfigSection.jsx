import React from "react";
import { SCRIPT_MODES, DEFAULT_TABLE_NAME, DEFAULT_SCRIPT_MODE } from "../utils/constants.js";

export default function ConfigSection({ tableName, setTableName, scriptMode, setScriptMode }) {
  return (
    <section className="card">
      <h2 className="section-label">Table Configuration</h2>
      <div className="config-grid">
        <div className="field-group">
          <label>Table Name</label>
          <input
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder={DEFAULT_TABLE_NAME}
          />
        </div>
        <div className="field-group">
          <label>Script Mode</label>
          <select value={scriptMode} onChange={(e) => setScriptMode(e.target.value)}>
            {SCRIPT_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
