import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui';

const STORAGE_KEY = 'promoapp.tour.v1';

const STEPS = [
  { id: 'dashboard', href: '/dashboard', title: 'Dashboard', body: 'Campaign stats and your onboarding checklist live here.' },
  { id: 'campaigns', href: '/campaigns', title: 'Campaigns', body: 'Create, edit, and publish giveaways from the builder.' },
  { id: 'analytics', href: '/analytics', title: 'Analytics', body: 'Workspace-level performance, separate from participant campaign analytics.' },
  { id: 'integrations', href: '/settings/integrations', title: 'Integrations', body: 'Connect ESPs, Google Sheets, and Zapier Catch Hooks.' },
  { id: 'workspace', href: '/settings/general', title: 'Workspace', body: 'Team, billing, and API keys for this workspace.' },
];

export function ProductTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    setIndex(0);
  }, []);

  if (index === null) return null;
  if (/\/campaigns\/.+/.test(location.pathname)) return null;
  const step = STEPS[index];
  if (!step) return null;

  const dismiss = (completed: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, completed ? 'completed' : 'dismissed');
    setIndex(null);
  };

  return (
    <div className="fixed bottom-6 left-4 z-[60] max-w-sm ml-0 lg:ml-64" data-testid="product-tour">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{index + 1} / {STEPS.length}</p>
        <h3 className="text-lg font-semibold mt-1">{step.title}</h3>
        <p className="text-sm text-zinc-400 mt-2">{step.body}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" variant="ghost" data-testid="tour-skip" onClick={() => dismiss(false)}>Skip</Button>
          {location.pathname !== step.href && (
            <Button size="sm" variant="secondary" onClick={() => navigate(step.href)}>Go there</Button>
          )}
          {index < STEPS.length - 1 ? (
            <Button size="sm" data-testid="tour-next" onClick={() => setIndex(index + 1)}>Next</Button>
          ) : (
            <Button size="sm" onClick={() => dismiss(true)}>Done</Button>
          )}
        </div>
      </div>
    </div>
  );
}
