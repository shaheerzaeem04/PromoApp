import { useSearchParams } from 'react-router-dom';
import { IntegrationListPage } from '../integrations/IntegrationList';
import { DeliveryLogPage } from '../integrations/DeliveryLogPage';
import { ApiPane } from './workspacePanes';
import { cn } from '../../utils/cn';

type Tab = 'catalog' | 'logs' | 'api';

export function SettingsIntegrationsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'catalog';
  const setTab = (next: Tab) => {
    const copy = new URLSearchParams(params);
    if (next === 'catalog') copy.delete('tab');
    else copy.set('tab', next);
    setParams(copy, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {(
          [
            { id: 'catalog' as const, label: 'Integrations' },
            { id: 'logs' as const, label: 'Logs' },
            { id: 'api' as const, label: 'Team API' },
          ]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'px-3 py-2 text-sm',
              tab === item.id ? 'border-b-2 border-primary-500 text-zinc-50' : 'text-zinc-500 hover:text-zinc-200'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'catalog' && <IntegrationListPage embedded />}
      {tab === 'logs' && <DeliveryLogPage embedded />}
      {tab === 'api' && <ApiPane />}
    </div>
  );
}
