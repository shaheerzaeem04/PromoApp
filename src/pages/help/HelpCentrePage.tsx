import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { HELP_ARTICLES, searchHelpArticles, type HelpCategory } from '../../content/help/articles';
import { SearchField } from '../../components/ui';
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
  const trimmed = query.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 mb-3">
        Help & guides
      </p>
      <h1 className="text-4xl font-display font-bold text-[#0B1020]">Help Centre</h1>
      <p className="text-[#667085] mt-3 max-w-2xl leading-relaxed">
        Guides for the current PromoApp product. Search is client-side.
      </p>

      <div className="mt-8">
        <SearchField
          aria-label="Search help articles"
          placeholder="Search articles…"
          value={query}
          onChange={setQuery}
          size="lg"
          data-testid="help-search"
        />
        <p className="mt-2.5 text-xs text-[#667085]">
          {trimmed
            ? `${results.length} result${results.length === 1 ? '' : 's'} for “${trimmed}”`
            : `${HELP_ARTICLES.length} articles available`}
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {CATEGORIES.map((category) => {
          const articles = results.filter((item) => item.category === category);
          if (!articles.length) return null;
          return (
            <motion.section
              key={category}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mt-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-semibold text-lg text-[#0B1020]">{category}</h2>
                <span className="h-px flex-1 bg-[#E8EAF0]" />
                <span className="text-xs text-[#667085]">{articles.length}</span>
              </div>
              <div className="grid gap-3">
                {articles.map((article, index) => (
                  <motion.div
                    key={article.slug}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
                  >
                    <Link to={`/help/${article.slug}`} className="block group">
                      <article className="card-interactive rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium text-[#0B1020] transition-colors duration-300 group-hover:text-primary-700">
                              {article.title}
                            </h3>
                            <p className="text-sm text-[#667085] mt-1 leading-relaxed">{article.summary}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-[#98A2B3] transition-all duration-300 group-hover:text-primary-600 group-hover:translate-x-0.5" />
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </AnimatePresence>

      {results.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[#667085] mt-10 rounded-xl border border-[#E8EAF0] bg-[#F8FAFC] px-4 py-6 text-center"
        >
          No articles match that search. Try another keyword or clear the filter.
        </motion.p>
      )}

      <p className="text-sm text-[#667085] mt-12 leading-relaxed">
        {HELP_ARTICLES.length} articles. There is no live chat. Email {supportEmail} or read these guides.
      </p>
    </div>
  );
}
