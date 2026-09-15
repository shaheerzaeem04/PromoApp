import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import type { Selection } from 'react-aria-components';
import { PageSpinner, EmptyState, SearchField, TagGroup, TagList, Tag } from '../../components/ui';
import { templateApi } from '../../services/api';
import { TemplateCard } from '../../components/templates/TemplateCard';
import { TemplatePreviewModal } from '../../components/templates/TemplatePreviewModal';
import {
  BROWSE_FILTERS,
  type CatalogTemplate,
} from '../../components/templates/templateMeta';
import { useNavigate } from 'react-router-dom';

export function TemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState<CatalogTemplate | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await templateApi.getAll();
      return (res.data.data || []) as CatalogTemplate[];
    },
  });

  const filtered = useMemo(() => {
    const templates = data || [];
    const q = query.trim().toLowerCase();
    return templates.filter((template) => {
      if (filter !== 'all') {
        const groups = template.browseGroups || [];
        if (!groups.includes(filter) && template.category !== filter) return false;
      }
      if (!q) return true;
      const hay = `${template.name} ${template.description || ''} ${template.badge || ''} ${template.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, filter]);

  const openTemplate = (template: CatalogTemplate) => {
    if (template.isBlank) {
      navigate('/campaigns/new');
      return;
    }
    setPreview(template);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 max-w-7xl">
      <header className="dash-hero p-6 md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-400">
          Library
        </p>
        <h1 className="font-display text-3xl md:text-[2.35rem] text-zinc-50 mt-2 leading-tight">
          Giveaway Templates
        </h1>
        <p className="page-desc mt-2 max-w-2xl">
          Create engaging giveaways faster with pre-built campaigns. Preview a realistic setup, then
          open the full builder with everything prefilled.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <SearchField
          className="w-full max-w-md"
          size="sm"
          aria-label="Search templates"
          placeholder="Search templates"
          value={query}
          onChange={setQuery}
        />
        <TagGroup
          aria-label="Template categories"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([filter])}
          onSelectionChange={(keys: Selection) => {
            if (keys === 'all') return;
            const next = [...keys][0];
            if (typeof next === 'string') setFilter(next);
          }}
        >
          <TagList>
            {BROWSE_FILTERS.map((item) => (
              <Tag key={item.id} id={item.id} textValue={item.label}>
                {item.label}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      </div>

      {isError ? (
        <EmptyState
          title="Could not load templates"
          description="Refresh the page or try again in a moment."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No templates match"
          description="Try another search or category filter."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template} onOpen={openTemplate} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {preview && (
          <TemplatePreviewModal
            key={preview.slug || preview.id}
            template={preview}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
