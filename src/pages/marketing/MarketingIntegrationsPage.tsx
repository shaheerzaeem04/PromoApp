import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, PageSpinner } from '../../components/ui';
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

function providerMark(name: string) {
  const letters = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return letters || name.slice(0, 2).toUpperCase();
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
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 mb-3">
        Connect your stack
      </p>
      <h1 className="text-4xl font-display font-bold text-[#0B1020]">{PAGE.title}</h1>
      <p className="text-[#667085] mt-3 max-w-2xl leading-relaxed">{PAGE.description}</p>

      {sections.map((section) => (
        <section key={section.id} className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-semibold text-lg text-[#0B1020]">{section.label}</h2>
            <span className="h-px flex-1 bg-[#E8EAF0]" />
            <span className="text-xs text-[#667085]">{section.items.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map((item: any) => (
              <Card
                key={item.type}
                padding="none"
                className="card-interactive group overflow-hidden p-0"
              >
                <div className="p-5">
                  <div className="flex items-start gap-3.5">
                    <span
                      className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 text-sm font-semibold flex items-center justify-center shrink-0 border border-primary-500/15 transition-all duration-300 group-hover:bg-primary-500 group-hover:text-zinc-950 group-hover:border-primary-500 group-hover:scale-105"
                      aria-hidden
                    >
                      {providerMark(item.name || item.type)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-[#0B1020] transition-colors duration-300 group-hover:text-primary-700">
                          {item.name}
                        </h3>
                        <span className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide bg-primary-50 text-primary-700 border border-primary-500/15 transition-colors duration-300 group-hover:bg-primary-500/15">
                          {item.minPlan}
                        </span>
                      </div>
                      <p className="text-sm text-[#667085] mt-1.5 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-[#E8EAF0] group-hover:border-primary-500/20 transition-colors duration-300">
                    <p className="text-xs text-[#667085]">
                      Auth: {formatAuthType(item.authType)}
                      {item.oauthLiveQaRequired ? ' · Live OAuth QA pending' : ''}
                    </p>
                    <Link
                      to={PAGE.ctaTo}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-all duration-300 group-hover:text-primary-700 group-hover:gap-2.5"
                    >
                      {PAGE.ctaLabel}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <p className="text-sm text-[#667085] mt-12 leading-relaxed">{PAGE.footer}</p>
    </div>
  );
}
