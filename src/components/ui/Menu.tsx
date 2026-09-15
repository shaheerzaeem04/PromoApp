import { Children, type ReactElement, type ReactNode } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger as AriaMenuTrigger,
  SubmenuTrigger as AriaSubmenuTrigger,
  Popover,
  Header,
  Separator,
  composeRenderProps,
  type MenuProps as AriaMenuProps,
  type MenuItemProps as AriaMenuItemProps,
  type MenuSectionProps as AriaMenuSectionProps,
  type MenuTriggerProps as AriaMenuTriggerProps,
  type SubmenuTriggerProps as AriaSubmenuTriggerProps,
  type PopoverProps,
  type SeparatorProps,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export interface MenuTriggerProps extends AriaMenuTriggerProps {
  placement?: PopoverProps['placement'];
}

export function MenuTrigger({ placement = 'bottom end', children, ...props }: MenuTriggerProps) {
  const [trigger, menu] = Children.toArray(children);
  return (
    <AriaMenuTrigger {...props}>
      {trigger}
      <Popover placement={placement} offset={8} className="ui-menu-popover">
        {menu}
      </Popover>
    </AriaMenuTrigger>
  );
}

export function SubmenuTrigger({ children, ...props }: AriaSubmenuTriggerProps) {
  const [trigger, menu] = Children.toArray(children);
  return (
    <AriaSubmenuTrigger {...props}>
      {trigger as ReactElement}
      <Popover offset={-2} crossOffset={-4} className="ui-menu-popover">
        {menu}
      </Popover>
    </AriaSubmenuTrigger>
  );
}

export interface MenuProps<T extends object> extends Omit<AriaMenuProps<T>, 'className'> {
  className?: string;
}

export function Menu<T extends object>({ className, ...props }: MenuProps<T>) {
  return <AriaMenu {...props} className={cn('ui-menu', className)} />;
}

export interface MenuItemProps<T extends object = object> extends Omit<AriaMenuItemProps<T>, 'className'> {
  className?: string;
}

export function MenuItem<T extends object = object>({ className, children, textValue, ...props }: MenuItemProps<T>) {
  const resolvedTextValue = textValue || (typeof children === 'string' ? children : undefined);
  return (
    <AriaMenuItem
      {...props}
      textValue={resolvedTextValue}
      className={cn('ui-menu-item', className)}
    >
      {composeRenderProps(children, (label, { selectionMode, isSelected, hasSubmenu }) => (
        <>
          {selectionMode !== 'none' ? (
            <span className="ui-menu-item-indicator" aria-hidden>
              {isSelected ? <Check className="w-4 h-4" /> : null}
            </span>
          ) : null}
          <span className="ui-menu-item-label">{label}</span>
          {hasSubmenu ? <ChevronRight className="ui-menu-item-chevron w-4 h-4" aria-hidden /> : null}
        </>
      ))}
    </AriaMenuItem>
  );
}

export interface MenuSectionProps<T extends object> extends AriaMenuSectionProps<T> {
  title?: string;
}

export function MenuSection<T extends object>({ className, title, children, ...props }: MenuSectionProps<T>) {
  return (
    <AriaMenuSection {...props} className={cn('ui-menu-section', className)}>
      {title ? <Header className="ui-menu-section-title">{title}</Header> : null}
      {children as ReactNode}
    </AriaMenuSection>
  );
}

export function MenuSeparator(props: SeparatorProps) {
  return <Separator {...props} className={cn('ui-menu-separator', props.className)} />;
}
