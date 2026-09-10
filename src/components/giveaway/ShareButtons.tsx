import { Twitter, Facebook, Linkedin, Copy, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareButtonsProps {
  url: string;
  title?: string;
  compact?: boolean;
}

export function ShareButtons({ url, title = 'Enter this giveaway', compact = false }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`${title} ${url}`);

  const copy = () => {
    navigator.clipboard.writeText(url);
    toast.success(compact ? 'Copied!' : 'Link copied!');
  };

  const openShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const buttonClass = 'p-2 rounded-lg text-sm font-semibold';

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copy}
        className={compact
          ? 'flex-1 min-w-[120px] py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-2 text-sm'
          : 'flex-1 min-w-[120px] py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-2 transition-colors'}
      >
        <Copy className="w-4 h-4" />
        Copy Link
      </button>
      <button type="button" aria-label="Share on X" onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)} className={`${buttonClass} bg-[#1da1f2] hover:bg-[#1a91da]`}>
        <Twitter className="w-5 h-5" />
      </button>
      <button type="button" aria-label="Share on Facebook" onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)} className={`${buttonClass} bg-[#1877f2] hover:bg-[#166fe5]`}>
        <Facebook className="w-5 h-5" />
      </button>
      <button type="button" aria-label="Share on LinkedIn" onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)} className={`${buttonClass} bg-[#0077b5] hover:bg-[#006aa3]`}>
        <Linkedin className="w-5 h-5" />
      </button>
      <a aria-label="Share on WhatsApp" href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass} bg-[#25d366] hover:bg-[#1ebe5b]`}>
        WA
      </a>
      <a aria-label="Share on Telegram" href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass} bg-[#229ed9] hover:bg-[#1c8fc4]`}>
        TG
      </a>
      <a aria-label="Share by email" href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} className={`${buttonClass} bg-zinc-700 hover:bg-zinc-600`}>
        <Mail className="w-5 h-5" />
      </a>
      <a aria-label="Share on Messenger" href={`https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=0&redirect_uri=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass} bg-[#0084ff] hover:bg-[#0073e0]`}>
        MS
      </a>
      <a aria-label="Share on Reddit" href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass} bg-[#ff4500] hover:bg-[#e03d00]`}>
        RD
      </a>
      <a aria-label="Share on Pinterest" href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass} bg-[#e60023] hover:bg-[#cc001f]`}>
        PI
      </a>
    </div>
  );
}
