import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, Badge, PageSpinner } from '../../components/ui';
import { docsApi } from '../../services/api';

type IntegrationCategory = {
  id: string;
  label: string;
};

const PAGE = {
  title: 'Integrations',
  description:
    'Directory generated from live provider metadata. Shopify is not available. Pixels are campaign tracking settings, not workspace integrations.',
  ctaLabel: 'Set up in PromoApp',
  ctaTo: '/register',
  footer:
    'HubSpot and Shopify are not listed — they are not functional in this release. Zapier tiles mean “Works with Zapier Webhooks”, not an official Marketplace app.',
} as const;

/** Providers excluded from the public marketing directory. */
const EXCLUDED_TYPES = ['FACEBOOK_PIXEL'] as const;

const CATEGORIES: IntegrationCategory[] = [
  { id: 'Email Marketing', label: 'Email Marketing' },
  { id: 'CRM', label: 'CRM' },
  { id: 'Automation', label: 'Automation' },
  { id: 'Export', label: 'Export' },
  { id: 'Analytics / Tracking', label: 'Analytics / Tracking' },
];

function formatAuthType(authType?: string) {
  return String(authType || '').replace(/_/g, ' ');
}

export function MarketingIntegrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-providers'],
    queryFn: () => docsApi.providers(),
  });

  const sections = useMemo(() => {
    const providers = (data?.data?.data || []).filter(
      (item: { type?: string }) => !EXCLUDED_TYPES.includes(item.type as (typeof EXCLUDED_TYPES)[number])
    );

    const byCategory = new Map<string, typeof providers>();
    for (const item of providers) {
      const key = item.category || 'Other';
      const list = byCategory.get(key);
      if (list) list.push(item);
      else byCategory.set(key, [item]);
    }

    return CATEGORIES
      .map((category) => ({
        ...category,
        items: byCategory.get(category.id) || [],
      }))
      .filter((section) => section.items.length > 0);
  }, [data]);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-display font-bold">{PAGE.title}</h1>
      <p className="text-zinc-400 mt-3">{PAGE.description}</p>

      {sections.map((section) => (
        <section key={section.id} className="mt-12">
          <h2 className="font-semibold text-lg mb-4">{section.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map((item: any) => (
              <Card
                key={item.type}
                hover
                className="p-5 card-interactive group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary-300 transition-colors duration-[400ms]">{item.name}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
                  </div>
                  <Badge>{item.minPlan}</Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Auth: {formatAuthType(item.authType)}
                  {item.oauthLiveQaRequired ? ' · Live OAuth QA pending' : ''}
                </p>
                <Link to={PAGE.ctaTo} className="inline-block mt-4 text-sm text-primary-400 group-hover:text-primary-300 transition-colors duration-[400ms]">
                  {PAGE.ctaLabel}
                </Link>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <p className="text-sm text-zinc-500 mt-12">{PAGE.footer}</p>
    </div>
  );
}
