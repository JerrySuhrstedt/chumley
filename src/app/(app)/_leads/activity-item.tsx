"use client";

import { useActionState, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Activity } from "@/db/schema";
import { deleteActivity, updateActivityNote } from "./actions";
import { activityMeta, isSystemActivity, outcomeMeta } from "./activity-meta";

export function ActivityItem({ activity }: { activity: Activity }) {
  const [editing, setEditing] = useState(false);
  const meta = activityMeta(activity.type);
  const outcome = outcomeMeta(activity.outcome);
  const Icon = meta.icon;
  const system = isSystemActivity(activity.type);

  const action = updateActivityNote.bind(null, activity.id);
  const [state, formAction, pending] = useActionState(
    async (prev: { error: string | null }, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.error) setEditing(false);
      return result;
    },
    { error: null }
  );

  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          system
            ? "bg-slate-50 text-slate-400"
            : "bg-slate-100 text-slate-600"
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

          <span className="ml-auto flex items-center gap-1">
            {!system && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                aria-label="Edit note"
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
          <form action={formAction} className="mt-2 flex flex-col gap-2">
            <Textarea
              name="body"
              rows={2}
              defaultValue={activity.body}
              placeholder="Add a note"
              autoFocus
            />
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={pending}>
                Save note
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : activity.body ? (
          <p
            className={cn(
              "mt-0.5 text-sm whitespace-pre-wrap",
              system ? "text-slate-500" : "text-slate-700"
            )}
          >
            {activity.body}
          </p>
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
    </li>
  );
}
