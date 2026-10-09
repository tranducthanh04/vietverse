import { createContext, useContext, useId } from "react";
import type { DraftView } from "./content.types.js";

export const EditorialNotesContext = createContext<DraftView["editorialNotes"]>(
  [],
);

export function useFieldNotes(field: string) {
  return useContext(EditorialNotesContext).filter(
    (note) => note.field.replace(/^payload\./, "") === field,
  );
}

export function useNoteDescription(field: string) {
  const id = useId();
  return useFieldNotes(field).length ? id : undefined;
}
