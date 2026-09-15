import { Tag } from '../ui';
import { cn } from '../../utils/cn';
import { templateDisplayTags, type CatalogTemplate } from './templateMeta';

interface TemplateTagsProps {
  template: CatalogTemplate;
  size?: 'sm' | 'md';
  showLabels?: boolean;
  showMeta?: boolean;
  className?: string;
}

export function TemplateTags({
  template,
  size = 'sm',
  showLabels = true,
  showMeta = false,
  className,
}: TemplateTagsProps) {
  const labels = showLabels ? templateDisplayTags(template) : [];
  const actionCount = template.config?.entryActions?.length || 0;
  const meta: Array<{ id: string; label: string; tone?: 'accent' | 'warning' }> = [];

  if (showMeta && actionCount > 0) meta.push({ id: 'actions', label: `${actionCount} actions` });
  if (showMeta && template.config?.enableSpinWheel) meta.push({ id: 'spin', label: 'Spin wheel', tone: 'warning' });
  if (showMeta && template.isBlank) meta.push({ id: 'blank', label: 'Empty builder', tone: 'accent' });

  if (labels.length === 0 && meta.length === 0) return null;

  return (
    <div className={cn('ui-tag-list', className)} aria-label={`${template.name} tags`}>
      {labels.map((label) => (
        <Tag key={label} size={size} decorative>
          {label}
        </Tag>
      ))}
      {meta.map((item) => (
        <Tag key={item.id} size={size} tone={item.tone} decorative>
          {item.label}
        </Tag>
      ))}
    </div>
  );
}
