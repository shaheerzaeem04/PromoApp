import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Calendar,
  Code2,
  Eye,
  Gift,
  LayoutTemplate,
  Link2,
  Palette,
  Share2,
  Shield,
  Sparkles,
  Users,
  Zap,
  Globe,
  Mail,
  HelpCircle,
  Camera,
  KeyRound,
  ThumbsUp,
} from 'lucide-react';
import { MarketingSection, SectionHeading } from './components/MarketingSection';
import { FeatureGrid } from './components/FeatureGrid';
import { ProductShowcase } from './components/ProductShowcase';
import { IntegrationGrid } from './components/IntegrationGrid';
import { FinalCTA } from './components/FinalCTA';

const CORE_FEATURES = [
  {
    title: 'Branded Giveaways',
    description: 'Colors, logos, imagery, and theme controls that match your brand.',
    icon: <Palette className="w-5 h-5" />,
  },
  {
    title: 'Flexible Entry Actions',
    description: 'Visits, questions, referrals, uploads, codes, and more.',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    title: 'Built-in Referrals',
    description: 'Unique links and bonus points when friends join.',
    icon: <Share2 className="w-5 h-5" />,
  },
  {
    title: 'Prize Management',
    description: 'Configure prizes, quantities, and rules before publish.',
    icon: <Gift className="w-5 h-5" />,
  },
  {
    title: 'Real-Time Analytics',
    description: 'Visitors, participants, entries, referrals, conversion.',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    title: 'Campaign Controls',
    description: 'Draft, schedule, publish, pause, and resume.',
    icon: <Calendar className="w-5 h-5" />,
  },
];

const BUILDER_FEATURES = [
  { title: 'Multi-step builder', description: 'Guided steps from template to publish.' },
  { title: 'Prize & action setup', description: 'Points, limits, and verification modes.' },
  { title: 'Live preview', description: 'See the hosted experience before you go live.' },
  { title: 'Scheduling & legal', description: 'Activate later with terms and consent.' },
];

const CUSTOM_FEATURES = [
  { title: 'Branding', description: 'Logo, colors, and campaign imagery.' },
  { title: 'Forms', description: 'Collect the participant details you need.' },
  { title: 'Themes', description: 'Polish the public experience for each campaign.' },
  { title: 'Custom CSS', description: 'Sanitized advanced styling where available.' },
  { title: 'Images', description: 'Hero and prize visuals that feel on-brand.' },
  { title: 'Mobile optimization', description: 'Responsive hosted pages and widgets.' },
];

const REFERRAL_BENEFITS = [
  { title: 'Unique invite links', description: 'Every entrant gets a shareable referral URL.' },
  { title: 'Attributed rewards', description: 'Bonus entries when someone else joins.' },
  { title: 'Fraud-aware tracking', description: 'Review flagged participants before draws.' },
  { title: 'Growth visibility', description: 'See how visits become referrals and entries.' },
];

const DISTRIBUTION = [
  { title: 'Hosted Page', icon: <Link2 className="w-5 h-5" /> },
  { title: 'Embed', icon: <Code2 className="w-5 h-5" /> },
  { title: 'Popup', icon: <LayoutTemplate className="w-5 h-5" /> },
  { title: 'Banner', icon: <Eye className="w-5 h-5" /> },
  { title: 'Slide-in', icon: <Share2 className="w-5 h-5" /> },
  { title: 'Share Link', icon: <Gift className="w-5 h-5" /> },
];

const ENTRY_ACTIONS = [
  { label: 'Visit Website', icon: <Globe className="w-4 h-4" /> },
  { label: 'Newsletter', icon: <Mail className="w-4 h-4" /> },
  { label: 'Referral', icon: <Share2 className="w-4 h-4" /> },
  { label: 'Question', icon: <HelpCircle className="w-4 h-4" /> },
  { label: 'Daily Bonus', icon: <Zap className="w-4 h-4" /> },
  { label: 'Photo Upload', icon: <Camera className="w-4 h-4" /> },
  { label: 'Secret Code', icon: <KeyRound className="w-4 h-4" /> },
  { label: 'Social Action', icon: <ThumbsUp className="w-4 h-4" /> },
];

const WORKFLOW = [
  { step: '01', title: 'Create', body: 'Start from scratch or a template.' },
  { step: '02', title: 'Configure', body: 'Prizes, actions, and rewards.' },
  { step: '03', title: 'Customize', body: 'Brand, fields, and legal copy.' },
  { step: '04', title: 'Publish', body: 'Go live, embed, or schedule.' },
];

const WINNER_CAPS = [
  { icon: <Shield className="w-4 h-4" />, label: 'Draw audit and winner history' },
  { icon: <Users className="w-4 h-4" />, label: 'Fraud clear, flag, or disqualify' },
  { icon: <Eye className="w-4 h-4" />, label: 'Claim and notify workflows' },
  { icon: <Award className="w-4 h-4" />, label: 'Server-side weighted draws' },
];

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <MarketingSection tone="white" className="!pt-16 sm:!pt-24 lg:!pt-28 !pb-16 sm:!pb-24 lg:!pb-28">
        <div className="text-center mx-auto max-w-[900px]">
          <SectionHeading
            as="h1"
            align="center"
            eyebrow="Giveaways built for growth"
            title="Build your audience with powerful branded giveaways"
            description="PromoApp lets teams design, launch, manage, and analyze branded contests without stitching together forms, embeds, referrals, and winner tools."
            className="!max-w-[900px]"
          />
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 mt-10">
            <Link to="/register" className="marketing-btn-primary px-8 py-3.5 text-base">
              Start Building
            </Link>
            <a href="#how-it-works" className="marketing-btn-secondary px-7 py-3.5 text-base">
              See How It Works
            </a>
          </div>
          <p className="text-sm text-[#667085] mt-5">No code required · Launch in minutes</p>
        </div>

        <div className="mt-16 sm:mt-20 lg:mt-24 relative max-w-[1200px] mx-auto">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%,52rem)] h-[min(70%,28rem)] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(167,139,250,0.28),_rgba(45,212,191,0.18)_45%,_transparent_70%)] blur-2xl"
          />
          <ProductShowcase
            variant="dashboard"
            panel="lavender"
            size="xl"
            className="relative z-10"
            caption="PromoApp dashboard showing campaign health and active campaigns"
          />
        </div>
      </MarketingSection>

      {/* Builder — large tinted showcase */}
      <MarketingSection tone="soft">
        <SectionHeading
          align="center"
          eyebrow="Campaign builder"
          title="A giveaway builder designed for growth"
          description="Build branding, entry actions, referrals, prizes, schedule, legal, and publishing in one workflow — with a live preview that mirrors the hosted page."
          className="!max-w-3xl"
        />
        <div className="mt-14 sm:mt-16 max-w-5xl mx-auto">
          <ProductShowcase
            variant="builder"
            panel="teal"
            size="xl"
            caption="PromoApp multi-step campaign builder"
          />
        </div>
        <div className="mt-16 sm:mt-20">
          <FeatureGrid items={CORE_FEATURES} />
        </div>
      </MarketingSection>

      {/* Product proof */}
      <MarketingSection tone="white" className="!py-16 sm:!py-20 lg:!py-24">
        <blockquote className="max-w-3xl mx-auto text-center">
          <p className="font-sans text-xl sm:text-2xl text-[#0B1020] leading-relaxed tracking-tight font-medium">
            PromoApp replaces the usual stack of form tools, embed scripts, and spreadsheet winner draws with one
            workspace that stays auditable.
          </p>
          <footer className="mt-5 text-sm text-[#667085]">
            Product principle · built for operators who need clarity over gimmicks
          </footer>
        </blockquote>
      </MarketingSection>

      {/* Build & launch */}
      <MarketingSection id="how-it-works" tone="neutral">
        <SectionHeading
          align="center"
          title="Build and launch your giveaway in minutes"
          description="A guided builder keeps owners focused on the decisions that matter, then publishes a real hosted campaign."
          className="!max-w-3xl"
        />
        <div className="mt-14 max-w-5xl mx-auto">
          <ProductShowcase variant="builder" panel="lavender" size="lg" caption="Campaign builder workflow preview" />
        </div>
        <ol className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {WORKFLOW.map((item) => (
            <li key={item.step} className="min-w-0">
              <span className="text-primary-600 text-xs font-semibold tracking-wider">{item.step}</span>
              <h3 className="font-semibold text-lg mt-3 text-[#0B1020]">{item.title}</h3>
              <p className="text-[0.95rem] text-[#667085] mt-2 leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16">
          <FeatureGrid items={BUILDER_FEATURES} columns={4} />
        </div>
      </MarketingSection>

      {/* Customization — visual left / text right */}
      <MarketingSection tone="white">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <ProductShowcase
            variant="giveaway"
            panel="lavender"
            caption="Branded public giveaway preview"
          />
          <div>
            <SectionHeading
              eyebrow="Brand experience"
              title="Make every giveaway feel like your brand"
              description="Control logo, colors, imagery, copy, form fields, success states, and theme. Advanced campaigns can use sanitized custom CSS where your plan allows."
            />
            <div className="mt-12">
              <FeatureGrid items={CUSTOM_FEATURES} columns={2} />
            </div>
          </div>
        </div>
      </MarketingSection>

      {/* Referrals */}
      <MarketingSection tone="teal">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <SectionHeading
              eyebrow="Viral growth"
              title="Turn every entrant into a growth channel"
              description="PromoApp issues unique referral URLs, attributes successful invites, and awards bonus entries when someone else joins — with leaderboard and fraud review when you need them."
            />
            <div className="mt-12 grid sm:grid-cols-2 gap-10">
              {REFERRAL_BENEFITS.map((item) => (
                <div key={item.title}>
                  <h3 className="text-base font-semibold text-[#0B1020]">{item.title}</h3>
                  <p className="text-[0.95rem] text-[#667085] mt-2 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductShowcase variant="referral" panel="none" caption="Referral link and reward summary" />
        </div>
      </MarketingSection>

      {/* Sharing */}
      <MarketingSection tone="white">
        <SectionHeading
          align="center"
          title="Share your giveaway everywhere your audience is"
          description="Publish a hosted page, embed on your site, or distribute links and QR codes."
          className="!max-w-3xl"
        />
        <div className="mt-14 max-w-4xl mx-auto">
          <ProductShowcase variant="embed" panel="neutral" caption="Hosted giveaway publishing preview" />
        </div>
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 max-w-4xl mx-auto">
          {DISTRIBUTION.map((item) => (
            <div key={item.title} className="text-center min-w-0">
              <div className="w-11 h-11 mx-auto rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <p className="text-sm font-medium text-[#0B1020]">{item.title}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* Entry actions */}
      <MarketingSection tone="soft">
        <SectionHeading
          align="center"
          title="Dozens of ways to engage your audience"
          description="Flexible entry actions across lead capture, social, uploads, codes, and custom webhooks."
          className="!max-w-3xl"
        />
        <div className="mt-12 flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {ENTRY_ACTIONS.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2.5 rounded-full bg-white border border-[#E8EAF0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] px-4 py-2.5 text-[0.95rem] text-[#0B1020]"
            >
              <span className="text-primary-600">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-[#667085] mt-10">
          <Link to="/features" className="text-primary-600 hover:text-primary-700 font-medium">
            See the full feature list
          </Link>
        </p>
      </MarketingSection>

      {/* Integrations */}
      <MarketingSection tone="white">
        <SectionHeading
          align="center"
          title="Connect PromoApp to the tools you already use"
          description="Provider list is generated from live product metadata. Availability can depend on plan and environment configuration."
          className="!max-w-3xl"
        />
        <div className="mt-14">
          <IntegrationGrid />
        </div>
      </MarketingSection>

      {/* Analytics */}
      <MarketingSection tone="neutral">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
          <SectionHeading
            eyebrow="Insights"
            title="Know exactly how your campaign is performing"
            description="Focus on the metrics that matter: visitors, participants, entries, conversion, and referrals — then export when you need a deeper look."
          />
          <ProductShowcase variant="analytics" panel="teal" caption="Campaign analytics" />
        </div>
      </MarketingSection>

      {/* Winners + secondary spin */}
      <MarketingSection tone="white">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          <div>
            <SectionHeading
              eyebrow="Winner management"
              title="Pick winners with confidence"
              description="Run server-side weighted draws with history, claim state, and fraud review — without turning selection into a black box for your team."
            />
            <ul className="mt-10 space-y-4">
              {WINNER_CAPS.map((item) => (
                <li key={item.label} className="flex gap-3 text-[0.95rem] text-[#667085]">
                  <span className="text-primary-600 shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-[#0B1020]">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <ProductShowcase variant="winners" panel="neutral" size="md" caption="Winner draw controls" />
        </div>

        <div className="mt-20 pt-12 border-t border-[#E8EAF0] flex gap-5 sm:gap-6 items-start max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0B1020]">Optional interactive rewards</h3>
            <p className="text-[0.95rem] text-[#667085] mt-2 leading-relaxed">
              Unlock a spin wheel after someone enters — as a bonus experience, not a distraction during signup. The
              public page keeps the entry form primary until the participant is eligible.
            </p>
          </div>
        </div>
      </MarketingSection>

      {/* Closing proof */}
      <MarketingSection tone="soft" className="!py-16 sm:!py-20">
        <div className="grid sm:grid-cols-3 gap-12 sm:gap-10 max-w-4xl mx-auto">
          {[
            { icon: <LayoutTemplate className="w-5 h-5" />, label: 'One builder', body: 'From template to publish without tool-hopping.' },
            { icon: <Code2 className="w-5 h-5" />, label: 'Real publishing', body: 'Hosted pages, embeds, and display modes that ship.' },
            { icon: <Shield className="w-5 h-5" />, label: 'Operator trust', body: 'Fraud review, draw history, and workspace roles.' },
          ].map((item) => (
            <div key={item.label} className="text-center sm:text-left">
              <div className="w-10 h-10 mx-auto sm:mx-0 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <p className="font-semibold text-[#0B1020]">{item.label}</p>
              <p className="text-[0.95rem] text-[#667085] mt-2 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <FinalCTA />
    </div>
  );
}
