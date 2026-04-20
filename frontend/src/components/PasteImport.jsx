import React from "react";
import { parsePaste } from "../services/api.js";
import { makeRow } from "../utils/helpers.js";

export default function PasteImport({ 
  open, 
  text, 
  setText, 
  onImport, 
  onClose 
}) {
  const handleImport = async () => {
    try {
      const data = await parsePaste(text);
      const newRows = data.fields.map((f) =>
        makeRow({
          label: f.label,
          english_label: f.english_label || "",
          field_name: f.field_name,
          data_type: f.data_type,
          default_value: f.default_value,
          not_null: f.not_null,
          resolved: f.resolved,
        })
      );
      onImport(newRows);
      onClose();
      setText("");
    } catch (error) {
      alert("Parse failed. Check your data format.");
    }
  };

  if (!open) return null;

  return (
    <div className="paste-box">
      <label>
        Paste tab-separated rows from Excel:<br />
        <span className="hint">Columns: No · 論理名 · 物理名 · データ型 · Not Null · Default · 備考</span>
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"1\t年月\tYEAR_MONTH\t*YYYYMM\tYes\t\t\n2\t府県コード\tAREA_CD\t*AREA_CODE\tYes\t\t"}
      />
      <div className="paste-actions">
        <button className="btn primary" onClick={handleImport}>Import</button>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
