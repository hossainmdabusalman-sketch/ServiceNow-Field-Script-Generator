import { useState, useCallback, useRef } from "react";
import { generateScript } from "../services/api.js";
import { copyToClipboard } from "../utils/helpers.js";

/**
 * Custom hook for script generation and management
 */
export const useScript = () => {
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const handleGenerate = useCallback(async (tableName, fields, scriptMode) => {
    setGenerating(true);
    try {
      const data = await generateScript(tableName, fields, scriptMode);
      setScript(data.script);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      alert("Generation failed. Is the Python backend running?");
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(script);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [script]);

  const clearScript = useCallback(() => {
    setScript("");
  }, []);

  return {
    script,
    setScript,
    generating,
    copied,
    outputRef,
    handleGenerate,
    handleCopy,
    clearScript,
  };
};
