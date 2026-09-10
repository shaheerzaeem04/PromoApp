import { CHANGELOG_ENTRIES } from '../../content/changelog';

export function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-display font-bold">Changelog</h1>
      <p className="text-zinc-400 mt-3">Product updates. Historical notes are not fabricated.</p>
      <div className="mt-10 space-y-10">
        {CHANGELOG_ENTRIES.map((entry) => (
          <article key={entry.slug} className="border-b border-zinc-800 pb-8">
            <p className="text-xs text-zinc-500">{entry.date}</p>
            <h2 className="text-2xl font-semibold mt-1">{entry.title}</h2>
            <p className="text-zinc-300 mt-4 whitespace-pre-line leading-relaxed">{entry.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
