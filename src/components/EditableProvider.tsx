"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Ctx = { copy: Record<string, string>; editMode: boolean };
const EditableContext = createContext<Ctx>({ copy: {}, editMode: false });

/**
 * Provides editable copy + edit-mode detection.
 * Edit mode activates ONLY when the page is framed by the same-origin admin
 * EditCanvas (window.self !== window.top). Detection is client-side in an
 * effect, so server-rendered HTML is byte-identical for crawlers (SEO-safe).
 */
export function EditableProvider({
  copy,
  children,
}: {
  copy: Record<string, string>;
  children: React.ReactNode;
}) {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setEditMode(true);
        document.documentElement.setAttribute("data-edit", "1");
      }
    } catch {
      // cross-origin frame access throws → treat as framed by a foreign site: no edit mode
    }
  }, []);

  return (
    <EditableContext.Provider value={{ copy, editMode }}>
      {children}
    </EditableContext.Provider>
  );
}

export function useEditable(): Ctx {
  return useContext(EditableContext);
}
