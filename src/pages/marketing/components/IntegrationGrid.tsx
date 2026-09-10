import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { docsApi } from '../../../services/api';
import { cn } from '../../../utils/cn';

const PRIORITY = [
  'MAILCHIMP',
  'KLAVIYO',
  'CONVERTKIT',
  'MAILERLITE',
  'ACTIVECAMPAIGN',
  'OMNISEND',
  'BEEHIIV',
  'BREVO',
  'ZAPIER',
  'CUSTOM_WEBHOOK',
  'GOOGLE_SHEETS',
];

function mark(name: string) {
  const letters = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return letters || name.slice(0, 2).toUpperCase();
}

export function IntegrationGrid() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-providers-home'],
    queryFn: () => docsApi.providers(),
  });

  const providers = ((data?.data?.data || []) as any[])
    .filter((item) => item.type !== 'FACEBOOK_PIXEL')
    .sort((a, b) => {
      const ai = PRIORITY.indexOf(a.type);
      const bi = PRIORITY.indexOf(b.type);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, 12);

  if (isLoading) {
    return <p className="text-sm text-[#667085] text-center">Loading integrations…</p>;
  }

  if (isError || !providers.length) {
    return (
      <p className="text-sm text-[#667085] text-center">
        See the full directory on{' '}
        <Link to="/product-integrations" className="text-primary-600 hover:text-primary-700 font-medium">
          Integrations
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
        {providers.map((item) => {
          const notConfigured =
            item.serverConfigured === false || item.type === 'GOOGLE_SHEETS';
          return (
            <div
              key={item.type}
              title={
                notConfigured
                  ? 'Available when Google OAuth is configured for your environment'
                  : item.description
              }
              className={cn(
                'flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 min-w-[148px] sm:min-w-[168px]',
                'border border-[#E8EAF0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
                notConfigured && 'opacity-70'
              )}
            >
              <span className="w-9 h-9 rounded-xl bg-primary-50 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">
                {mark(item.name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0B1020] truncate">{item.name}</p>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  {notConfigured ? 'Not configured' : 'Available'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-[#667085] mt-10 text-center max-w-xl mx-auto leading-relaxed">
        Shopify and HubSpot are not available in this release.{' '}
        <Link to="/product-integrations" className="text-primary-600 hover:text-primary-700 font-medium">
          View all integrations
        </Link>
      </p>
    </div>
  );
}
