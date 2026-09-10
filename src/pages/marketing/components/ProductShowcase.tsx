import { cn } from '../../../utils/cn';

type Panel = 'lavender' | 'teal' | 'neutral' | 'none';

/** Dark product UI mocks framed in light premium showcase panels. */
export function ProductShowcase({
  variant = 'dashboard',
  className,
  caption,
  panel = 'lavender',
  size = 'lg',
}: {
  variant?: 'dashboard' | 'builder' | 'giveaway' | 'analytics' | 'referral' | 'embed' | 'winners';
  className?: string;
  caption?: string;
  panel?: Panel;
  size?: 'md' | 'lg' | 'xl';
}) {
  return (
    <figure className={cn('min-w-0 relative', className)}>
      <div
        className={cn(
          panel !== 'none' && 'rounded-[1.5rem] sm:rounded-[1.75rem] p-4 sm:p-7 lg:p-9',
          panel === 'lavender' && 'bg-[#F6F2FF]',
          panel === 'teal' && 'bg-[#F2FBF9]',
          panel === 'neutral' && 'bg-[#F6F7F9]',
          panel === 'none' && ''
        )}
      >
        <div
          className={cn(
            'relative rounded-2xl overflow-hidden bg-[#0B1020] ring-1 ring-black/10',
            'shadow-[0_28px_80px_-36px_rgba(15,23,42,0.55)]',
            size === 'xl' && 'min-h-[300px] sm:min-h-[420px]',
            size === 'lg' && 'min-h-[260px] sm:min-h-[360px]',
            size === 'md' && 'min-h-[220px] sm:min-h-[280px]'
          )}
        >
          <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/[0.06] bg-[#080A0C]">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="ml-2 text-[11px] text-zinc-500 truncate">
              {variant === 'giveaway' ? 'promoapp.app/c/summer-kit' : 'app.promoapp'}
            </span>
          </div>
          <div className="text-zinc-100">
            {variant === 'dashboard' && <DashboardMock />}
            {variant === 'builder' && <BuilderMock />}
            {variant === 'giveaway' && <GiveawayMock />}
            {variant === 'analytics' && <AnalyticsMock />}
            {variant === 'referral' && <ReferralMock />}
            {variant === 'embed' && <EmbedMock />}
            {variant === 'winners' && <WinnersMock />}
          </div>
        </div>
      </div>
      {caption && <figcaption className="sr-only">{caption}</figcaption>}
    </figure>
  );
}

function DashboardMock() {
  return (
    <div className="grid grid-cols-[56px_1fr] sm:grid-cols-[148px_1fr] min-h-[280px] sm:min-h-[400px]">
      <aside className="border-r border-white/[0.06] bg-[#080A0C] p-2.5 sm:p-3.5 space-y-2">
        <div className="h-6 w-6 sm:w-24 rounded-md bg-primary-500 mb-4" />
        {['Dashboard', 'Campaigns', 'Analytics'].map((item, i) => (
          <div
            key={item}
            className={cn(
              'h-8 rounded-md text-[11px] sm:text-xs flex items-center px-2.5',
              i === 0 ? 'bg-primary-500/15 text-primary-400' : 'text-zinc-500'
            )}
          >
            <span className="hidden sm:inline truncate">{item}</span>
            <span className="sm:hidden w-3 h-3 rounded bg-current opacity-40" />
          </div>
        ))}
      </aside>
      <div className="p-4 sm:p-6 space-y-5 bg-[#0B1020]">
        <div>
          <p className="text-base sm:text-lg font-semibold tracking-tight">Campaign health</p>
          <p className="text-xs mt-1 text-zinc-500">Active campaigns and recent entry activity</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            ['Participants', '1,284'],
            ['Entries', '4,902'],
            ['Referrals', '318'],
            ['Live', '3'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl p-3 bg-white/[0.04]">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
              <p className="text-base sm:text-xl font-semibold tabular-nums mt-1">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl divide-y divide-white/[0.06]">
          {['Summer Kit Giveaway', 'Launch Waitlist', 'Holiday Sweepstakes'].map((name, i) => (
            <div key={name} className="flex items-center justify-between px-1 py-3 text-sm">
              <span className="truncate">{name}</span>
              <span
                className={cn(
                  'shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium',
                  i < 2 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                )}
              >
                {i < 2 ? 'ACTIVE' : 'SCHEDULED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuilderMock() {
  return (
    <div className="grid lg:grid-cols-[1fr_0.95fr] min-h-[300px] sm:min-h-[400px]">
      <div className="p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/[0.06] space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {['Start', 'Basics', 'Prizes', 'Actions', 'Design', 'Review'].map((step, i) => (
            <span
              key={step}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-full',
                i === 3 ? 'bg-primary-500 text-zinc-950 font-medium' : 'bg-white/[0.06] text-zinc-400'
              )}
            >
              {i + 1}. {step}
            </span>
          ))}
        </div>
        <p className="text-sm font-semibold">Entry actions</p>
        <div className="space-y-2.5">
          {['Visit website · +1', 'Newsletter · +1', 'Refer a friend · +5', 'Daily bonus · +1'].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm bg-white/[0.04]"
            >
              <span>{row.split(' · ')[0]}</span>
              <span className="text-primary-400 font-medium">{row.split(' · ')[1]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-5 bg-[#080A0C]/50">
        <p className="text-[11px] text-zinc-500 mb-3 uppercase tracking-wide">Live preview</p>
        <div className="rounded-xl p-5 text-center space-y-2.5 max-w-xs mx-auto bg-[#11171A] ring-1 ring-white/[0.06]">
          <p className="text-[10px] text-primary-400 uppercase tracking-widest font-medium">Giveaway</p>
          <p className="text-base font-semibold">Win the Summer Kit</p>
          <p className="text-xs text-zinc-500">Enter once, unlock bonus actions, share your link.</p>
          <div className="h-9 rounded-lg bg-zinc-800" />
          <div className="h-9 rounded-lg bg-primary-500 text-zinc-950 text-sm font-medium flex items-center justify-center">
            Enter giveaway
          </div>
        </div>
      </div>
    </div>
  );
}

function GiveawayMock() {
  return (
    <div className="grid sm:grid-cols-[1.15fr_0.75fr] gap-0 min-h-[300px]">
      <div className="p-6 sm:p-10 text-center space-y-3.5 flex flex-col justify-center">
        <p className="text-[11px] text-primary-400 uppercase tracking-widest font-medium">Giveaway</p>
        <p className="text-2xl sm:text-3xl font-semibold tracking-tight">Win a branded prize kit</p>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
          Complete actions, invite friends, and climb the leaderboard.
        </p>
        <div className="max-w-sm mx-auto w-full space-y-2.5 pt-3 text-left">
          <div className="h-11 rounded-lg bg-zinc-800/80" />
          <div className="h-11 rounded-lg bg-zinc-800/80" />
          <div className="h-11 rounded-lg bg-primary-500 text-zinc-950 text-sm font-medium flex items-center justify-center">
            Enter giveaway
          </div>
          <p className="text-xs text-zinc-500 text-center pt-1">Enter to unlock your spin</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center justify-center p-5 border-l border-white/[0.06] bg-[#080A0C]/40">
        <div className="w-[150px] rounded-[1.6rem] p-3 bg-[#11171A] ring-1 ring-white/[0.08] shadow-lg">
          <div className="rounded-xl p-3.5 space-y-2 bg-[#080A0C]">
            <p className="text-[11px] font-semibold text-center">You’re in</p>
            <p className="text-2xl font-semibold text-center tabular-nums text-primary-400">12</p>
            <p className="text-[10px] text-zinc-500 text-center">entries</p>
            <div className="h-6 rounded bg-zinc-800" />
            <div className="h-6 rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMock() {
  return (
    <div className="p-5 sm:p-7 space-y-5 min-h-[280px] sm:min-h-[360px]">
      <p className="text-base font-semibold tracking-tight">Campaign analytics</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ['Visitors', '8,420'],
          ['Participants', '1,284'],
          ['Entries', '4,902'],
          ['Conversion', '15.2%'],
          ['Referrals', '318'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl p-3 bg-white/[0.04]">
            <p className="text-[11px] text-zinc-500">{label}</p>
            <p className="text-lg font-semibold tabular-nums mt-1.5">{value}</p>
          </div>
        ))}
      </div>
      <div className="h-36 rounded-xl relative overflow-hidden bg-gradient-to-t from-primary-500/10 to-transparent">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
          <path
            d="M0 95 C 60 85, 90 50, 140 55 S 220 25, 280 40 S 360 15, 400 30"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </div>
  );
}

function ReferralMock() {
  return (
    <div className="p-5 sm:p-7 space-y-5 min-h-[260px] sm:min-h-[340px]">
      <div>
        <p className="text-base font-semibold tracking-tight">Invite friends</p>
        <p className="text-sm text-zinc-500 mt-1">Points are added when someone else enters with your link.</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-11 rounded-xl px-3.5 flex items-center text-sm truncate bg-white/[0.04] text-zinc-400">
          https://promoapp.app/c/summer-kit?ref=ANN7K2
        </div>
        <div className="h-11 px-4 rounded-xl bg-primary-500 text-zinc-950 text-sm font-medium flex items-center">
          Copy
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 bg-white/[0.04]">
          <p className="text-[11px] text-zinc-500">Successful referrals</p>
          <p className="text-2xl font-semibold tabular-nums mt-1">7</p>
        </div>
        <div className="rounded-xl p-4 bg-white/[0.04]">
          <p className="text-[11px] text-zinc-500">Referral points</p>
          <p className="text-2xl font-semibold tabular-nums mt-1 text-primary-400">35</p>
        </div>
      </div>
      <div className="rounded-xl p-4 space-y-2 bg-white/[0.03]">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Viral loop</p>
        <p className="text-sm leading-relaxed text-zinc-500">
          Enter → share unique link → friend joins → bonus entries credited
        </p>
      </div>
    </div>
  );
}

function EmbedMock() {
  return (
    <div className="p-5 sm:p-8 min-h-[260px] sm:min-h-[320px] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#11171A] p-6 text-center space-y-3">
        <p className="text-[11px] text-primary-400 uppercase tracking-widest font-medium">Hosted giveaway</p>
        <p className="text-xl font-semibold">Win a branded prize kit</p>
        <p className="text-sm text-zinc-500">Share via page, embed, popup, banner, or slide-in.</p>
        <div className="h-11 rounded-lg bg-primary-500 text-zinc-950 text-sm font-medium flex items-center justify-center">
          Enter giveaway
        </div>
      </div>
    </div>
  );
}

function WinnersMock() {
  return (
    <div className="p-5 sm:p-6 min-h-[220px] space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Winner draw</p>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Ready</span>
      </div>
      <div className="rounded-xl p-4 space-y-3 bg-white/[0.04]">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Prize</span>
          <span className="font-medium">Summer Kit</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Eligible pool</span>
          <span className="font-medium tabular-nums">1,284</span>
        </div>
        <div className="h-10 rounded-lg bg-primary-500 text-zinc-950 text-sm font-medium flex items-center justify-center">
          Draw winner
        </div>
      </div>
      <p className="text-xs text-zinc-500">Audit log · claim state · fraud review</p>
    </div>
  );
}
