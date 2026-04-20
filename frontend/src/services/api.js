// API base URL
const API = import.meta.env.VITE_API_URL ||"https://service-now-field-script-generator.vercel.app/" || "http://localhost:8000";

/**
 * Resolve a data type to ServiceNow equivalent
 */
export const resolveType = async (dataType) => {
  if (!dataType) return null;
  try {
    const res = await fetch(`${API}/api/resolve-type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data_type: dataType }),
    });
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Resolve multiple data types
 */
export const resolveAllTypes = async (fields) => {
  return Promise.all(
    fields.map(async (f) => ({
      ...f,
      resolved: f.data_type ? await resolveType(f.data_type) : null,
    }))
  );
};

/**
 * Parse tab-separated text from Excel
 */
export const parsePaste = async (text) => {
  try {
    const res = await fetch(`${API}/api/parse-paste`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return await res.json();
  } catch (error) {
    console.error("Parse failed:", error);
    throw new Error("Failed to parse data");
  }
};

/**
 * Generate ServiceNow script
 */
export const generateScript = async (tableName, fields, scriptMode) => {
  try {
    const res = await fetch(`${API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_name: tableName,
        fields: fields.map(({ label, english_label, field_name, data_type, default_value, not_null }) => ({
          label,
          english_label,
          field_name,
          data_type,
          default_value,
          not_null,
        })),
        script_mode: scriptMode,
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("Generation failed:", error);
    throw new Error("Failed to generate script");
  }
};
