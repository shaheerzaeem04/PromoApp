import { type ComponentType, lazy } from 'react';

/** Route-level code split for named page exports (avoids converting every page to a default export). */
export function lazyNamed<P extends object = Record<string, never>>(
  importer: () => Promise<{ [exportName: string]: ComponentType<P> }>,
  exportName: string,
) {
  return lazy(() =>
    importer().then((mod) => ({ default: mod[exportName] })),
  );
}
