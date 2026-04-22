import React from "react";
import TypeBadge from "./TypeBadge.jsx";

export default function FieldsTable({
  rows,
  resolving,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onDataTypeBlur,
  onResolveAll,
  onPasteOpen,
  pasteOpen,
}) {
  return (
    <section className="card">
      <div className="section-header">
        <h2 className="section-label">Field Definitions</h2>
        <div className="toolbar">
          <button className="btn" onClick={onAddRow}>+ Add Row</button>
          <button className="btn" onClick={() => onPasteOpen(!pasteOpen)}>
            Paste from Excel
          </button>
          <button className="btn ghost" onClick={onResolveAll} disabled={resolving}>
            {resolving ? "Resolving…" : "↻ Resolve Types"}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="field-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th>論理名 (Japanese Label)</th>
              {/* <th>English Label</th> */}
              <th>物理名 (Field Name)</th>
              <th>データ型 (Oracle / Domain)</th>
              <th className="col-type">→ SN Type</th>
              <th>Default Value</th>
              <th className="col-act"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No fields yet — add a row or paste from Excel
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? "even" : "odd"}>
                <td className="col-num">{i + 1}</td>
                <td>
                  <input
                    value={row.label}
                    onChange={(e) => onUpdateRow(row.id, "label", e.target.value)}
                    placeholder="年月"
                  />
                </td>
                {/* <td>
                  <input
                    value={row.english_label}
                    onChange={(e) => onUpdateRow(row.id, "english_label", e.target.value)}
                    placeholder="Year Month"
                  />
                </td> */}
                <td>
                  <input
                    value={row.field_name}
                    onChange={(e) => onUpdateRow(row.id, "field_name", e.target.value)}
                    placeholder="YEAR_MONTH"
                    className="mono"
                  />
                </td>
                <td>
                  <input
                    value={row.data_type}
                    onChange={(e) => onUpdateRow(row.id, "data_type", e.target.value)}
                    onBlur={(e) => onDataTypeBlur(row.id, e.target.value)}
                    placeholder="*YEN_TH or CHAR(4)"
                    className="mono"
                  />
                </td>
                <td className="col-type">
                  <TypeBadge resolved={row.resolved} />
                </td>
                <td>
                  <input
                    value={row.default_value}
                    onChange={(e) => onUpdateRow(row.id, "default_value", e.target.value)}
                    placeholder="—"
                  />
                </td>
                <td className="col-act">
                  <button className="del-btn" onClick={() => onRemoveRow(row.id)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
