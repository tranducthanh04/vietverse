import React from "react";
import { useFieldNotes } from "./editorialNotesContext.js";

export function FieldNotes({ field, id }: { field: string; id?: string }) {
  const notes = useFieldNotes(field);
  if (!notes.length) return null;
  return (
    <aside id={id} role="note" aria-label={`Ghi chú nguồn: ${field}`}>
      {notes.map((note, index) => (
        <p key={index}>
          {note.message} ({note.reason})
        </p>
      ))}
    </aside>
  );
}
