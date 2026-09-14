import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { workspaceApi } from '../../services/api';

export function OnboardingChecklist() {
  const reduceMotion = useReducedMotion();
  const { data } = useQuery({
    queryKey: ['workspace-onboarding'],
    queryFn: () => workspaceApi.onboarding(),
  });
  const payload = data?.data?.data;
  if (!payload?.steps?.length) return null;
  if (payload.percent === 100) return null;

  return (
    <motion.div
      data-testid="onboarding-checklist"
      className="dash-hero p-6"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="section-title">Get started</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Progress from real workspace data — {payload.completed} of {payload.total} complete.
          </p>
        </div>
        <span className="text-sm font-medium tabular-nums text-primary-300">{payload.percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800/90 overflow-hidden mb-5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
          initial={{ width: reduceMotion ? `${payload.percent}%` : 0 }}
          animate={{ width: `${payload.percent}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <ol className="space-y-1.5">
        {payload.steps.map((step: { id: string; label: string; done: boolean; href: string }) => (
          <li key={step.id}>
            <Link
              to={step.href}
              data-testid={`onboarding-step-${step.id}`}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 text-sm transition-colors duration-200 hover:bg-primary-500/10"
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-500 shrink-0" />
              )}
              <span className={step.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}>{step.label}</span>
              {!step.done && (
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-zinc-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-primary-400 group-hover:translate-x-0.5" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}
