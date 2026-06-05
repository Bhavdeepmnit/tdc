import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Note } from '@types';
import { Card } from '@components/ui/Card';
import { fromNow } from '@utils/date';
import { cn } from '@utils/cn';

export interface NoteCardProps {
  note: Note;
  /** Display name of the matchmaker who authored the note. */
  authorName?: string;
  onDelete?: (noteId: string) => void;
  className?: string;
}

/**
 * A matchmaker note card with content, timestamp, author, and delete action.
 * Delete requires inline confirmation to prevent accidental data loss.
 */
export function NoteCard({ note, authorName, onDelete, className }: NoteCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card className={cn('relative space-y-1.5', className)}>
      {/* Note content */}
      <p className="text-body text-text-primary whitespace-pre-wrap">{note.content}</p>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <p className="text-caption text-text-secondary">
          {authorName && (
            <span className="font-medium text-text-primary">{authorName}</span>
          )}
          {authorName && ' · '}
          {fromNow(note.createdAt)}
        </p>

        {/* Delete action */}
        {onDelete && (
          <div className="flex items-center gap-1.5">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(note.id);
                    setConfirmDelete(false);
                  }}
                  className="rounded px-2 py-0.5 text-caption font-medium text-status-error-text hover:bg-red-50 transition-colors"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded px-2 py-0.5 text-caption text-text-secondary hover:bg-surface-sidebar transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-disabled hover:bg-red-50 hover:text-status-error-text transition-colors"
                aria-label="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
