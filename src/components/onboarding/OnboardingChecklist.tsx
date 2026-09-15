import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { workspaceApi } from '../../services/api';

export function OnboardingChecklist() {
  const { data } = useQuery({
    queryKey: ['workspace-onboarding'],
    queryFn: () => workspaceApi.onboarding(),
  });
  const payload = data?.data?.data;
  if (!payload?.steps?.length) return null;
  if (payload.percent === 100) return null;

  return (
    <section data-testid="onboarding-checklist">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div>
          <h2 className="section-title">Get started</h2>
          <p className="meta mt-1">
            {payload.completed} of {payload.total} complete
          </p>
        </div>
        <span className="text-sm tabular-nums text-zinc-500">{payload.percent}%</span>
      </div>
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${payload.percent}%` }}
        />
      </div>
      <ol className="divide-y divide-zinc-800/60 border-t border-zinc-800/60">
        {payload.steps.map((step: { id: string; label: string; done: boolean; href: string }) => (
          <li key={step.id}>
            <Link
              to={step.href}
              data-testid={`onboarding-step-${step.id}`}
              className="group flex items-center gap-3 py-2.5 text-sm hover:text-zinc-50"
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-500 shrink-0" />
              )}
              <span className={step.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}>{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
