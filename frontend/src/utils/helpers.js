// Helper functions

let nextId = 1;

/**
 * Create a new field row with default values
 */
export const makeRow = (overrides = {}) => {
  return {
    id: nextId++,
    label: "",
    english_label: "",
    field_name: "",
    data_type: "",
    default_value: "",
    not_null: false,
    resolved: null,
    ...overrides,
  };
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
};

/**
 * Format field for display
 */
export const formatFieldForDisplay = (field) => {
  const labels = [];
  if (field.english_label) labels.push(field.english_label);
  if (field.label) labels.push(field.label);
  return labels.join(" / ") || field.field_name;
};

/**
 * Validate field data
 */
export const validateField = (field) => {
  if (!field.field_name) return "Field name is required";
  return null;
};

/**
 * Reset ID counter
 */
export const resetNextId = () => {
  nextId = 1;
};
