import { Link, useParams } from 'react-router-dom';
import { HELP_ARTICLES } from '../../content/help/articles';

export function HelpArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = HELP_ARTICLES.find((item) => item.slug === slug);
  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-display font-bold">Article not found</h1>
        <Link to="/help" className="text-primary-400 mt-4 inline-block">Back to Help Centre</Link>
      </div>
    );
  }
  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{article.category}</p>
      <h1 className="text-4xl font-display font-bold mt-2">{article.title}</h1>
      <p className="text-zinc-400 mt-3">{article.summary}</p>
      <div className="prose prose-invert mt-8 max-w-none whitespace-pre-line text-zinc-300 leading-relaxed">
        {article.body}
      </div>
      <Link to="/help" className="text-primary-400 mt-10 inline-block">All articles</Link>
    </article>
  );
}
