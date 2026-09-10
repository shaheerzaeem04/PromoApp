import { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export function FeatureGrid({
  items,
  columns = 3,
}: {
  items: { title: string; description: string; icon?: ReactNode }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        'grid gap-x-10 gap-y-12',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4'
      )}
    >
      {items.map((item) => (
        <article key={item.title} className="min-w-0">
          {item.icon && (
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              {item.icon}
            </div>
          )}
          <h3 className="text-base sm:text-[1.0625rem] font-semibold text-[#0B1020] tracking-tight">
            {item.title}
          </h3>
          <p className="text-[0.9375rem] sm:text-base text-[#667085] mt-2.5 leading-relaxed">
            {item.description}
          </p>
        </article>
      ))}
    </div>
  );
}
