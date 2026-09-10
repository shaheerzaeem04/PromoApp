const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;
const DIRECT_VIDEO = /\.(mp4|webm|ogg)(\?.*)?$/i;

export type HeroMedia =
  | { kind: 'image'; src: string }
  | { kind: 'youtube'; src: string; id: string }
  | { kind: 'vimeo'; src: string; id: string }
  | { kind: 'video'; src: string }
  | { kind: 'none' };

function safeHttpUrl(raw: string | null | undefined): URL | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url;
  } catch {
    return null;
  }
}

export function sanitizeHeroMedia(input: { featuredImage?: string | null; featuredVideo?: string | null; heroMedia?: HeroMedia }): HeroMedia {
  if (input.heroMedia && input.heroMedia.kind !== 'none') return input.heroMedia;
  const video = safeHttpUrl(input.featuredVideo);
  if (video) {
    const href = video.toString();
    const yt = href.match(YOUTUBE);
    if (yt && /^[A-Za-z0-9_-]{6,}$/.test(yt[1])) {
      return { kind: 'youtube', id: yt[1], src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
    }
    const vimeo = href.match(VIMEO);
    if (vimeo && video.hostname.replace(/^www\./, '') === 'vimeo.com') {
      return { kind: 'vimeo', id: vimeo[1], src: `https://player.vimeo.com/video/${vimeo[1]}` };
    }
    if (DIRECT_VIDEO.test(video.pathname)) {
      return { kind: 'video', src: video.toString() };
    }
  }
  const image = safeHttpUrl(input.featuredImage);
  if (image) return { kind: 'image', src: image.toString() };
  return { kind: 'none' };
}
