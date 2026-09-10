import { useState } from 'react';
import { Check, ChevronRight, Gift } from 'lucide-react';
import { cn } from '../utils/cn';
import { publicApi } from '../services/api';
import { getActionDefinition, socialDestinationUrl, verificationLabelForMode } from './actionCatalog';

interface ActionRunnerProps {
  slug: string;
  actions: any[];
  participant: any;
  sessionToken: string;
  completedActions: Set<string>;
  onCompleted: (actionId: string, points: number, extra?: any) => void;
  compact?: boolean;
}

export function ActionRunner({
  slug,
  actions,
  participant,
  sessionToken,
  completedActions,
  onCompleted,
  compact,
}: ActionRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = (actions || []).filter((action: any) => action.type !== 'SECRET_CODE' && action.type !== 'VIRAL_SHARE');

  const dailyFor = (actionId: string) => (participant?.dailyStatus || []).find((item: any) => item.actionId === actionId);

  const complete = async (action: any, metadata?: any) => {
    setError(null);
    setBusy(action.id);
    try {
      const response = await publicApi.submitEntry(slug, participant.id, action.id, sessionToken, metadata);
      onCompleted(action.id, response.data.data.points || action.points, response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Could not complete this action');
    } finally {
      setBusy(null);
    }
  };

  const upload = async (action: any, file: File) => {
    setError(null);
    setUploading(action.id);
    try {
      const response = await publicApi.uploadFile(slug, participant.id, action.id, file, sessionToken);
      onCompleted(action.id, response.data.data.entry.points || action.points);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="divide-y divide-zinc-800/70">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {visible.map((action: any) => {
        const definition = getActionDefinition(action.type);
        const isCompleted = completedActions.has(action.id);
        const daily = dailyFor(action.id);
        const lockedDaily = Boolean(daily && daily.remainingToday === 0 && !isCompleted);
        const dest = socialDestinationUrl(action.type, action.config || {});
        const inputType = action.config?.inputType || 'text';
        const options = Array.isArray(action.config?.options) ? action.config.options.map(String) : [];

        return (
          <div
            key={action.id}
            className={cn(
              'w-full py-3 text-left',
              isCompleted ? 'text-emerald-400' : ''
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', isCompleted ? 'bg-emerald-500/15' : 'bg-zinc-800/80')}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <Gift className="w-4 h-4 text-zinc-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  {action.description && <p className="text-xs text-zinc-500 mt-0.5">{action.description}</p>}
                  <p className="text-xs text-zinc-500 mt-1">
                    {verificationLabelForMode(action.verificationMode || definition?.verification)} · {action.publicHint || definition?.publicHint}
                    {action.required ? ' · Required' : ''}
                    {daily ? ` · ${daily.usedToday} today` : ''}
                  </p>
                  {lockedDaily && daily?.nextAvailableAt && (
                    <p className="text-xs text-amber-400 mt-1">Next available {new Date(daily.nextAvailableAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <span className="text-right shrink-0">
                <span className={cn('block text-xs tabular-nums', isCompleted ? 'text-emerald-400' : 'text-primary-400')}>
                  +{action.points}
                </span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">
                  {isCompleted ? 'Completed' : lockedDaily ? 'Locked' : 'Available'}
                </span>
              </span>
            </div>

            {!isCompleted && !lockedDaily && action.type === 'QUESTION' && (
              <div className="mt-3 space-y-2">
                <p className="text-sm">{action.config?.question || action.title}</p>
                {inputType === 'multi' ? (
                  options.map((option: string) => {
                    const selected = Array.isArray(answers[action.id]) ? answers[action.id] : [];
                    return (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(option)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...selected, option] : selected.filter((item: string) => item !== option);
                            setAnswers((prev) => ({ ...prev, [action.id]: next }));
                          }}
                        />
                        {option}
                      </label>
                    );
                  })
                ) : inputType === 'select' || inputType === 'choice' || inputType === 'radio' ? (
                  options.map((option: string) => (
                    <label key={option} className="flex items-center gap-2 text-sm">
                      <input type="radio" name={action.id} checked={answers[action.id] === option} onChange={() => setAnswers((prev) => ({ ...prev, [action.id]: option }))} />
                      {option}
                    </label>
                  ))
                ) : (
                  <input
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                    value={answers[action.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [action.id]: e.target.value }))}
                    placeholder="Your answer"
                  />
                )}
                <button
                  type="button"
                  disabled={busy === action.id}
                  onClick={() => complete(action, { response: answers[action.id] })}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
                >
                  Submit answer
                </button>
              </div>
            )}

            {!isCompleted && !lockedDaily && (action.type === 'PHOTO_UPLOAD' || action.type === 'DOCUMENT_UPLOAD') && (
              <div className="mt-3">
                <input
                  type="file"
                  accept={action.type === 'PHOTO_UPLOAD' ? 'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp' : 'application/pdf,.pdf'}
                  disabled={uploading === action.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(action, file);
                  }}
                />
              </div>
            )}

            {!isCompleted && !lockedDaily && action.type === 'WEBHOOK_COMPLETE' && (
              <p className="mt-3 text-sm text-zinc-500">Waiting for an external system to complete this action.</p>
            )}

            {!isCompleted && !lockedDaily && action.type !== 'QUESTION' && action.type !== 'PHOTO_UPLOAD' && action.type !== 'DOCUMENT_UPLOAD' && action.type !== 'WEBHOOK_COMPLETE' && (
                <button
                  type="button"
                  data-testid={`action-complete-${action.type}`}
                  disabled={busy === action.id}
                onClick={() => {
                  if (dest) window.open(dest, '_blank', 'noopener,noreferrer');
                  complete(action);
                }}
                className={cn('mt-3 w-full py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-sm flex items-center justify-center gap-2 disabled:opacity-50', compact && 'py-1.5')}
              >
                {busy === action.id ? 'Saving…' : action.verificationMode === 'honor_system' ? 'I did this' : 'Complete'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
