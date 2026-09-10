interface Pixel {
  type: 'FACEBOOK_PIXEL' | 'GOOGLE_ADS' | 'TWITTER_PIXEL';
  pixelId: string;
}

function noscriptUrl(pixel: Pixel) {
  const id = encodeURIComponent(pixel.pixelId);
  if (pixel.type === 'FACEBOOK_PIXEL') return `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`;
  if (pixel.type === 'GOOGLE_ADS') return `https://www.googleadservices.com/pagead/conversion/${id}/?guid=ON&script=0`;
  return `https://analytics.twitter.com/i/adsct?txn_id=${id}&p_id=Twitter`;
}

export function TrackingPixels({
  pixels,
  requireLegalAcceptance,
  privacyAccepted,
}: {
  pixels?: Pixel[];
  requireLegalAcceptance?: boolean;
  privacyAccepted?: boolean;
}) {
  if (!pixels?.length) return null;
  if (requireLegalAcceptance && !privacyAccepted) return null;
  return (
    <>
      {pixels.map((pixel) => (
        <img
          key={`${pixel.type}-${pixel.pixelId}`}
          src={noscriptUrl(pixel)}
          alt=""
          width={1}
          height={1}
          className="hidden"
          referrerPolicy="no-referrer"
        />
      ))}
    </>
  );
}
