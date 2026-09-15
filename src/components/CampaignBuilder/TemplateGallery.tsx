import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Check, ArrowRight } from 'lucide-react';
import { templateApi } from '../../services/api';
import { Card, Button, PageSpinner, Tag } from '../ui';
import { type CatalogTemplate } from '../templates/templateMeta';
import { TemplateCover } from '../templates/TemplateCover';
import { TemplateTags } from '../templates/TemplateTags';

interface TemplateGalleryProps {
  onSelect: (template: CatalogTemplate) => void;
  selectedId?: string;
}

export function TemplateGallery({ onSelect, selectedId }: TemplateGalleryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await templateApi.getAll();
      return res.data.data as CatalogTemplate[];
    },
  });

  const templates = (data || []).filter((t) => !t.isBlank).slice(0, 8);

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-zinc-500">Pick a blank campaign or a pre-built template.</p>
        <Link
          to="/templates"
          className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
        >
          Browse all templates <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() =>
            onSelect({
              id: 'blank',
              slug: 'blank',
              name: 'Blank',
              category: 'blank',
              config: {},
              isPublic: false,
              isBlank: true,
            })
          }
          className={`relative text-left p-4 min-h-[148px] card-interactive group ${
            selectedId === 'blank' ? 'card-interactive-selected' : 'border-dashed'
          }`}
        >
          <div className="h-20 rounded-lg mb-3 overflow-hidden">
            <TemplateCover
              template={{
                id: 'blank',
                slug: 'blank',
                name: 'Blank',
                category: 'blank',
                config: {},
                isPublic: false,
                isBlank: true,
              }}
              compact
              className="h-full"
            />
          </div>
          <p className="font-semibold group-hover:text-primary-300 transition-colors duration-[400ms]">
            Start from Scratch
          </p>
          <p className="text-sm text-zinc-400 mt-0.5">Build your campaign step by step</p>
          {selectedId === 'blank' && (
            <div className="absolute top-3 right-3 p-1 rounded-full bg-primary-500">
              <Check className="w-3.5 h-3.5 text-zinc-950" />
            </div>
          )}
        </motion.button>

        {templates.map((template) => {
          const isSelected = selectedId === template.id || selectedId === template.slug;
          const disabled = Boolean(template.comingSoon);

          return (
            <motion.button
              key={template.id}
              whileHover={disabled ? undefined : { y: -2 }}
              whileTap={disabled ? undefined : { scale: 0.99 }}
              onClick={() => {
                if (disabled) return;
                onSelect(template);
              }}
              disabled={disabled}
              className={`relative text-left p-4 min-h-[148px] card-interactive group ${
                isSelected ? 'card-interactive-selected' : ''
              } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <TemplateCover template={template} compact className="h-20 rounded-lg mb-3" />
              <TemplateTags template={template} size="sm" className="mb-1.5" />
              <h4 className="font-semibold group-hover:text-primary-300 transition-colors duration-[400ms]">
                {template.name}
              </h4>
              <p className="text-sm text-zinc-400 line-clamp-2 mt-0.5">{template.description}</p>
              <TemplateTags template={template} size="sm" showLabels={false} showMeta className="mt-3" />
              {isSelected && (
                <div className="absolute top-3 right-3 p-1 rounded-full bg-primary-500">
                  <Check className="w-3.5 h-3.5 text-zinc-950" />
                </div>
              )}
              {!template.isPublic && (
                <span className="pointer-events-none absolute top-3 left-3 z-[2]">
                  <Tag size="sm" tone="accent" decorative>Your template</Tag>
                </span>
              )}
              {template.comingSoon && (
                <span className="pointer-events-none absolute top-3 right-10 z-[2]">
                  <Tag size="sm" decorative>Coming soon</Tag>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
          <p className="text-zinc-400 mb-4">Browse the full library or start from scratch.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() =>
                onSelect({
                  id: 'blank',
                  slug: 'blank',
                  name: 'Blank',
                  category: 'blank',
                  config: {},
                  isPublic: false,
                  isBlank: true,
                })
              }
            >
              Start from Scratch
            </Button>
            <Link to="/templates">
              <Button variant="secondary">Browse templates</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
