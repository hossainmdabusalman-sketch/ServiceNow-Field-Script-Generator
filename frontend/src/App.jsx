import React, { useState, useEffect } from "react";
import "./App.css";

// Import components
import {
  Header,
  ConfigSection,
  FieldsTable,
  PasteImport,
  ScriptOutput,
  Footer,
} from "./components/index.js";

// Import hooks
import { useFields } from "./hooks/useFields.js";
import { useScript } from "./hooks/useScript.js";

// Import utils
import { DEFAULT_TABLE_NAME, DEFAULT_SCRIPT_MODE } from "./utils/constants.js";
import { resolveType } from "./services/api.js";

export default function App() {
  const [tableName, setTableName] = useState(DEFAULT_TABLE_NAME);
  const [scriptMode, setScriptMode] = useState(DEFAULT_SCRIPT_MODE);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const { rows, resolving, addRow, removeRow, updateRow, handleDataTypeBlur, handleResolveAll, handlePasteImport, clearAll } = useFields();
  const { script, generating, copied, outputRef, handleGenerate, handleCopy, clearScript } = useScript();

  // Resolve types on load
  useEffect(() => {
    handleResolveAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenScriptClick = () => {
    handleGenerate(tableName, rows, scriptMode);
  };

  const handleClearAll = () => {
    clearAll();
    clearScript();
  };

  const handlePasteImportClick = (newRows) => {
    handlePasteImport(newRows);
  };

  return (
    <div className="app">
      <Header />

      <main className="main">
        {/* Configuration */}
        <ConfigSection
          tableName={tableName}
          setTableName={setTableName}
          scriptMode={scriptMode}
          setScriptMode={setScriptMode}
        />

        {/* Fields Table */}
        <FieldsTable
          rows={rows}
          resolving={resolving}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onUpdateRow={updateRow}
          onDataTypeBlur={handleDataTypeBlur}
          onResolveAll={handleResolveAll}
          onPasteOpen={setPasteOpen}
          pasteOpen={pasteOpen}
        />

        {/* Paste Import Dialog */}
        {pasteOpen && (
          <PasteImport
            open={pasteOpen}
            text={pasteText}
            setText={setPasteText}
            onImport={handlePasteImportClick}
            onClose={() => setPasteOpen(false)}
          />
        )}

        {/* Actions */}
        <div className="actions">
          <button className="btn primary large" onClick={handleGenScriptClick} disabled={generating}>
            {generating ? "Generating…" : "⚡ Generate Script"}
          </button>
          <button className="btn ghost" onClick={handleClearAll}>Clear All</button>
        </div>

        {/* Script Output */}
        <ScriptOutput
          script={script}
          copied={copied}
          onCopy={handleCopy}
          outputRef={outputRef}
        />
      </main>

      <Footer />
    </div>
  );
}
