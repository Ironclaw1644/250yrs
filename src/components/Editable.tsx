"use client";

import { useRef, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { useEditable } from "./EditableProvider";
import { updateCopy } from "@/lib/actions/copy";

/**
 * Inline-editable text. Public mode renders a bare tag (no attrs/handlers —
 * SEO-safe). In edit mode (admin EditCanvas iframe) it becomes click-to-edit
 * contentEditable; blur or Enter saves via the updateCopy server action.
 */
export function Editable({
  id,
  as: Tag = "span" as ElementType,
  className,
  children,
}: {
  id: string; // site_content key, e.g. "copy.home.hero.headline"
  as?: ElementType;
  className?: string;
  children?: React.ReactNode; // fallback when no stored copy
}) {
  const { copy, editMode } = useEditable();
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  const stored = copy[id];
  const content = stored !== undefined && stored !== "" ? stored : children;

  if (!editMode) {
    return <Tag className={className}>{content}</Tag>;
  }

  async function save() {
    const el = ref.current;
    if (!el) return;
    const text = (el.innerText ?? "").replace(/\s+/g, " ").trim();
    setSaving(true);
    await updateCopy(id, text);
    setSaving(false);
    router.refresh();
  }

  return (
    <Tag
      ref={ref}
      className={`${className ?? ""} editable ${saving ? "editable-saving" : ""}`}
      title="Click to edit"
      contentEditable
      suppressContentEditableWarning
      onBlur={save}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    >
      {content}
    </Tag>
  );
}
