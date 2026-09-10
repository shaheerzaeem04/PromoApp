import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HELP_ARTICLES, searchHelpArticles, type HelpCategory } from '../../content/help/articles';
import { Card, Input } from '../../components/ui';
import { docsApi } from '../../services/api';

const CATEGORIES: HelpCategory[] = [
  'Getting Started',
  'Campaign Builder',
  'Entry Actions',
  'Design',
  'Publishing',
  'Integrations',
  'Winners',
  'Analytics',
  'Teams',
  'Billing',
  'Troubleshooting',
];

export function HelpCentrePage() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchHelpArticles(query), [query]);
  const { data: support } = useQuery({
    queryKey: ['docs-support'],
    queryFn: () => docsApi.support(),
  });
  const supportEmail = support?.data?.data?.supportEmail || 'support@promoapp.example';

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-display font-bold">Help Centre</h1>
      <p className="text-zinc-400 mt-3">Guides for the current PromoApp product. Search is client-side.</p>
      <div className="mt-6">
        <Input
          placeholder="Search articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="help-search"
        />
      </div>
      {CATEGORIES.map((category) => {
        const articles = results.filter((item) => item.category === category);
        if (!articles.length) return null;
        return (
          <section key={category} className="mt-10">
            <h2 className="font-semibold text-lg mb-3">{category}</h2>
            <div className="grid gap-3">
              {articles.map((article) => (
                <Link key={article.slug} to={`/help/${article.slug}`}>
                  <Card className="p-4 hover:border-primary-500/40">
                    <h3 className="font-medium">{article.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{article.summary}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {results.length === 0 && <p className="text-zinc-500 mt-8">No articles match that search.</p>}
      <p className="text-sm text-zinc-500 mt-12">
        {HELP_ARTICLES.length} articles. There is no live chat. Email {supportEmail} or read these guides.
      </p>
    </div>
  );
}
