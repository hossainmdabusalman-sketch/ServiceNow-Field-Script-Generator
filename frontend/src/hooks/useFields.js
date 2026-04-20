import { useState, useEffect, useCallback } from "react";
import { resolveAllTypes } from "../services/api.js";
import { makeRow } from "../utils/helpers.js";
import { SAMPLE_ROWS } from "../utils/constants.js";

/**
 * Custom hook for managing field definitions
 */
export const useFields = () => {
  const [rows, setRows] = useState(() =>
    SAMPLE_ROWS.map((r) => makeRow(r))
  );
  const [resolving, setResolving] = useState(false);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, makeRow()]);
  }, []);

  const removeRow = useCallback((id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRow = useCallback((id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const handleDataTypeBlur = useCallback(async (id, value) => {
    const updatedRows = rows.map((r) => r);
    const rowIndex = updatedRows.findIndex((r) => r.id === id);
    if (rowIndex !== -1) {
      const resolved = await resolveType(value);
      updatedRows[rowIndex].resolved = resolved;
      setRows(updatedRows);
    }
  }, [rows]);

  const handleResolveAll = useCallback(async () => {
    setResolving(true);
    try {
      const updated = await resolveAllTypes(rows);
      setRows(updated);
    } catch (error) {
      console.error("Failed to resolve types:", error);
    } finally {
      setResolving(false);
    }
  }, [rows]);

  const handlePasteImport = useCallback((newRows) => {
    setRows((prev) => [...prev, ...newRows]);
  }, []);

  const clearAll = useCallback(() => {
    setRows([]);
  }, []);

  return {
    rows,
    setRows,
    resolving,
    addRow,
    removeRow,
    updateRow,
    handleDataTypeBlur,
    handleResolveAll,
    handlePasteImport,
    clearAll,
  };
};
