import { Outlet } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex overflow-x-hidden bg-background">
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-zinc-900 border-r border-zinc-800">
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-on-primary" />
            </div>
            <span className="font-semibold tracking-tight">PromoApp</span>
          </div>

          <div className="max-w-sm">
            <h1 className="font-display text-4xl leading-tight text-zinc-50">
              Giveaways that look as good as they convert.
            </h1>
            <p className="text-zinc-400 mt-5 leading-relaxed">
              Launch a campaign, collect entries, and reward winners — without the clutter of a generic contest builder.
            </p>
          </div>

          <p className="text-sm text-zinc-600">© {new Date().getFullYear()} PromoApp</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-w-0 overflow-x-hidden">
        <div className="w-full max-w-md min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
