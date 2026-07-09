"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditable } from "./EditableProvider";
import { updateCopy } from "@/lib/actions/copy";

/**
 * Multi-paragraph editable prose. Public mode renders paragraphs split on
 * blank lines (bare tags, SEO-safe). Edit mode swaps to a textarea.
 */
export function EditableProse({
  id,
  className,
  paragraphClassName,
  fallback,
}: {
  id: string;
  className?: string;
  paragraphClassName?: string;
  fallback: string;
}) {
  const { copy, editMode } = useEditable();
  const router = useRouter();
  const stored = copy[id];
  const text = stored !== undefined && stored !== "" ? stored : fallback;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);

  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);

  if (!editMode) {
    return (
      <div className={className}>
        {paragraphs.map((p, i) => (
          <p key={i} className={paragraphClassName}>
            {p}
          </p>
        ))}
      </div>
    );
  }

  if (!editing) {
    return (
      <div
        className={`${className ?? ""} editable`}
        title="Click to edit"
        onClick={() => {
          setDraft(text);
          setEditing(true);
        }}
      >
        {paragraphs.map((p, i) => (
          <p key={i} className={paragraphClassName}>
            {p}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={Math.max(4, draft.split("\n").length + 1)}
        className="w-full rounded-md border-2 border-gold bg-paper-raised p-3 font-sans text-body text-char focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={saving}
          className="btn btn-gold !min-h-9 px-3 text-small"
          onClick={async () => {
            setSaving(true);
            await updateCopy(id, draft.trim());
            setSaving(false);
            setEditing(false);
            router.refresh();
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className="btn btn-secondary !min-h-9 px-3 text-small"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
