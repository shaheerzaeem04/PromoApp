import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card } from '../ui';
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
    <div data-testid="onboarding-checklist">
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Get started</h2>
          <p className="text-sm text-zinc-400">Progress from real workspace data — {payload.completed} of {payload.total} complete.</p>
        </div>
        <span className="text-sm text-primary-400">{payload.percent}%</span>
      </div>
      <ol className="space-y-2">
        {payload.steps.map((step: { id: string; label: string; done: boolean; href: string }) => (
          <li key={step.id}>
            <Link
              to={step.href}
              data-testid={`onboarding-step-${step.id}`}
              className="flex items-center gap-3 text-sm hover:text-white"
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-500" />
              )}
              <span className={step.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}>{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
    </div>
  );
}
