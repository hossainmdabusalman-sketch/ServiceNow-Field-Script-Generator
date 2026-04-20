import React from "react";

export default function TypeBadge({ resolved }) {
  if (!resolved) return <span className="badge muted">—</span>;
  
  const { type, max_len, scale, note } = resolved;
  const label = `${type}${max_len ? `(${max_len})` : ""}${scale ? ` s${scale}` : ""}`;
  
  return (
    <span className={`badge ${note ? "warn" : "info"}`} title={note || ""}>
      {label}
    </span>
  );
}
