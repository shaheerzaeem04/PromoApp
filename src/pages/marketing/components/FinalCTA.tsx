import { Link } from 'react-router-dom';
import { MarketingSection } from './MarketingSection';

export function FinalCTA({
  title = 'Ready to grow your audience?',
  description = 'Build your first branded giveaway and start turning engagement into measurable growth.',
  primaryTo = '/register',
  primaryLabel = 'Create Your Giveaway',
  secondaryTo = '/features',
  secondaryLabel = 'Explore Features',
}: {
  title?: string;
  description?: string;
  primaryTo?: string;
  primaryLabel?: string;
  secondaryTo?: string;
  secondaryLabel?: string;
}) {
  return (
    <MarketingSection tone="cta" className="!py-24 sm:!py-32 lg:!py-40">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-[2rem] sm:text-4xl lg:text-[2.75rem] font-sans font-semibold tracking-[-0.03em] text-[#0B1020] leading-[1.15]">
          {title}
        </h2>
        <p className="text-[#667085] mt-5 text-[1.0625rem] sm:text-lg leading-[1.7]">{description}</p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 mt-10">
          <Link to={primaryTo} className="marketing-btn-primary px-8 py-3.5 text-base">
            {primaryLabel}
          </Link>
          <Link to={secondaryTo} className="marketing-btn-secondary px-7 py-3.5 text-base">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </MarketingSection>
  );
}
