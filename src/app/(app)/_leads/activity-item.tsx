"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Activity } from "@/db/schema";
import { deleteActivity, setActivityNote } from "./actions";
import { activityMeta, isSystemActivity, outcomeMeta } from "./activity-meta";

/**
 * One line of history, and the note attached to it.
 *
 * Editing used to cost three deliberate actions: find the pencil, type, then
 * press Save, and clicking anywhere else threw the typing away. That is the
 * same friction the call logger had, sitting on every entry already in the
 * timeline, so fixing calls alone left most of the problem in place.
 *
 * Two changes. The note itself is the target, not just the pencil, because
 * the thing a rep wants to change is the thing they are looking at. And it
 * saves when they leave, so walking away commits the work instead of
 * discarding it. The Save button stays for anyone who wants to press it,
 * but nothing depends on it any more.
 */
export function ActivityItem({ activity }: { activity: Activity }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(activity.body);
  const [saved, setSaved] = useState(false);
  const [working, start] = useTransition();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const meta = activityMeta(activity.type);
  const outcome = outcomeMeta(activity.outcome);
  const Icon = meta.icon;
  const system = isSystemActivity(activity.type);

  // What is on the server, so blur can tell a real change from a stray click.
  const savedBody = useRef(activity.body);
  const bodyRef = useRef(body);
  useEffect(() => {
    bodyRef.current = body;
  }, [body]);

  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  const commit = (close: boolean) => {
    const text = bodyRef.current.trim();
    if (text === savedBody.current) {
      if (close) setEditing(false);
      return;
    }
    start(async () => {
      const { error } = await setActivityNote(activity.id, text);
      if (!error) {
        savedBody.current = text;
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }
      if (close) setEditing(false);
    });
  };

  // Leaving the page mid-edit still commits, so a closed dialog or a
  // navigation does not quietly bin what was typed.
  useEffect(() => {
    if (!editing) return;
    return () => {
      const text = bodyRef.current.trim();
      if (text !== savedBody.current) {
        void setActivityNote(activity.id, text);
        savedBody.current = text;
      }
    };
  }, [editing, activity.id]);

  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          system ? "bg-slate-50 text-slate-400" : "bg-slate-100 text-slate-600"
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            {meta.label}
          </span>
          {outcome && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                outcome.className
              )}
            >
              {outcome.label}
            </span>
          )}
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
          </span>
          {saved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <Check className="size-3" />
              Saved
            </span>
          )}

          <span className="ml-auto flex items-center gap-1">
            {!system && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                aria-label={editing ? "Close note" : "Edit note"}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            <form
              action={async () => {
                await deleteActivity(activity.id);
              }}
              onSubmit={(e) => {
                if (!confirm("Delete this log entry?")) e.preventDefault();
              }}
            >
              <button
                type="submit"
                aria-label="Delete log entry"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </form>
          </span>
        </div>

        {editing ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <textarea
              ref={areaRef}
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => commit(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commit(true);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setBody(savedBody.current);
                  setEditing(false);
                }
              }}
              placeholder="Add a note"
              maxLength={2000}
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            />
            <p className="text-[11px] text-slate-400">
              Saves when you click away. Enter saves and closes, Shift+Enter
              for a new line, Escape undoes.
            </p>
          </div>
        ) : activity.body ? (
          /* The note is the target. Clicking the words a rep is already
             looking at is more obvious than finding an icon for them. */
          !system ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-0.5 w-full cursor-text rounded text-left text-sm whitespace-pre-wrap text-slate-700 hover:bg-slate-50"
            >
              {activity.body}
            </button>
          ) : (
            <p className="mt-0.5 text-sm whitespace-pre-wrap text-slate-500">
              {activity.body}
            </p>
          )
        ) : (
          !system && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-0.5 text-sm text-slate-400 hover:underline"
            >
              Add a note
            </button>
          )
        )}
      </div>
      {working && <span className="sr-only">Saving</span>}
    </li>
  );
}
