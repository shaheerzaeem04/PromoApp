import { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export function MarketingSection({
  id,
  children,
  className,
  tone = 'white',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: 'white' | 'soft' | 'neutral' | 'lavender' | 'teal' | 'cta';
}) {
  return (
    <section
      id={id}
      className={cn(
        'py-20 sm:py-28 lg:py-36',
        tone === 'white' && 'bg-white',
        tone === 'soft' && 'bg-[#FAFAFC]',
        tone === 'neutral' && 'bg-[#F6F7F9]',
        tone === 'lavender' && 'bg-[#F6F2FF]',
        tone === 'teal' && 'bg-[#F2FBF9]',
        tone === 'cta' &&
          'bg-[linear-gradient(135deg,_#F2FBF9_0%,_#F6F2FF_55%,_#FAFAFC_100%)]',
        className
      )}
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 min-w-0">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as = 'h2',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  className?: string;
}) {
  const Heading = as;
  return (
    <div
      className={cn(
        align === 'center' && 'text-center mx-auto',
        as === 'h1' ? 'max-w-[860px]' : 'max-w-[640px]',
        className
      )}
    >
      {eyebrow && (
        <p className="text-[13px] sm:text-sm font-semibold tracking-[0.06em] uppercase text-primary-600 mb-4">
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          'font-sans font-semibold tracking-[-0.03em] text-[#0B1020] text-balance',
          as === 'h1'
            ? 'text-[2.5rem] sm:text-5xl lg:text-[4rem] leading-[1.08]'
            : 'text-[2rem] sm:text-4xl lg:text-[2.75rem] leading-[1.15]'
        )}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            'mt-5 sm:mt-6 text-[1.0625rem] sm:text-lg leading-[1.7] text-[#667085]',
            align === 'center' && 'mx-auto max-w-[640px]'
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
