"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface DisplayNameEditorProps {
  gameId: string;
  initialName: string;
  /** Called after a successful save so the parent can update its state */
  onNameChange?: (newName: string) => void;
}

export default function DisplayNameEditor({
  gameId,
  initialName,
  onNameChange,
}: DisplayNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/games/${gameId}/participant`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update name");
      }

      const data = await res.json();
      setName(data.name);
      onNameChange?.(data.name);
      setEditing(false);
      toast.success("Display name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={50}
          className="h-7 w-36 text-sm px-2"
          disabled={saving}
        />
        <button
          onClick={save}
          disabled={saving}
          className="p-1 rounded text-green-500 hover:text-green-400 disabled:opacity-50"
          aria-label="Save name"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      title="Change your display name in this game"
    >
      <span className="font-medium text-foreground">{name}</span>
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}
