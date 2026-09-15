import { Tag } from '../ui';
import { cn } from '../../utils/cn';
import type { CatalogTemplate } from './templateMeta';
import { TemplateCover } from './TemplateCover';
import { TemplateTags } from './TemplateTags';

interface TemplateCardProps {
  template: CatalogTemplate;
  onOpen: (template: CatalogTemplate) => void;
}

export function TemplateCard({ template, onOpen }: TemplateCardProps) {
  const activate = () => onOpen(template);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-card text-left',
        'transition-[transform,border-color,box-shadow] duration-300',
        'hover:-translate-y-0.5 hover:border-primary-500/40 hover:shadow-lg hover:shadow-black/20'
      )}
      data-testid={`template-card-${template.slug || template.id}`}
    >
      <button
        type="button"
        onClick={activate}
        className="absolute inset-0 z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/50"
        aria-label={`Preview ${template.name}`}
      />

      <TemplateCover template={template} className="aspect-[16/10]" />

      {template.comingSoon && (
        <span className="pointer-events-none absolute right-3 top-3 z-[2]">
          <Tag size="sm" decorative>Coming soon</Tag>
        </span>
      )}
      {!template.isPublic && (
        <span className="pointer-events-none absolute left-3 top-3 z-[2]">
          <Tag size="sm" tone="accent" decorative>Yours</Tag>
        </span>
      )}

      <div className="relative p-4">
        <TemplateTags template={template} size="sm" className="mb-2" />
        <h3 className="font-semibold text-zinc-50 transition-colors group-hover:text-primary-200">
          {template.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{template.description}</p>
        <TemplateTags template={template} size="sm" showLabels={false} showMeta className="mt-3" />
      </div>
    </article>
  );
}
