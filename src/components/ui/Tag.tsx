import { type ReactNode } from 'react';
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
  Label,
  type TagProps as AriaTagProps,
  type TagGroupProps as AriaTagGroupProps,
  type TagListProps as AriaTagListProps,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export interface TagGroupProps extends Omit<AriaTagGroupProps, 'className'> {
  label?: ReactNode;
  className?: string;
}

export function TagGroup({ className, label, children, ...props }: TagGroupProps) {
  return (
    <AriaTagGroup {...props} className={cn('ui-tag-group', className)}>
      {label ? <Label className="ui-tag-group-label">{label}</Label> : null}
      {children}
    </AriaTagGroup>
  );
}

export interface TagListProps<T extends object> extends Omit<AriaTagListProps<T>, 'className'> {
  className?: string;
}

export function TagList<T extends object>({ className, ...props }: TagListProps<T>) {
  return <AriaTagList {...props} className={cn('ui-tag-list', className)} />;
}

export interface TagProps extends Omit<AriaTagProps, 'className'> {
  className?: string;
  size?: 'sm' | 'md';
  tone?: 'default' | 'accent' | 'warning';
  /** Visual-only pill. Use for labels that sit on cards or images, not filter selection. */
  decorative?: boolean;
}

export function Tag({
  className,
  size = 'md',
  tone = 'default',
  decorative = false,
  children,
  ...props
}: TagProps) {
  const classes = cn(
    'ui-tag',
    size === 'sm' && 'ui-tag--sm',
    tone === 'accent' && 'ui-tag--accent',
    tone === 'warning' && 'ui-tag--warning',
    className
  );

  if (decorative) {
    return <span className={classes}>{children as ReactNode}</span>;
  }

  return (
    <AriaTag {...props} className={classes}>
      {children}
    </AriaTag>
  );
}
