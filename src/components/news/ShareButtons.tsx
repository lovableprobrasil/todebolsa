import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  url: string;
  title: string;
  slug: string;
}

export function ShareButtons({ url, title, slug }: Props) {
  const [copied, setCopied] = useState(false);

  const track = () => {
    void supabase.rpc("increment_news_share", { _slug: slug });
  };

  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  const targets = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
      color: "bg-[#25D366] hover:bg-[#1ebe5b]",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
      color: "bg-black hover:bg-neutral-800",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      color: "bg-[#0A66C2] hover:bg-[#084d92]",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: "bg-[#1877F2] hover:bg-[#1063cf]",
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-8 border-y border-border py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold mr-2">Compartilhar:</span>
        {targets.map((t) => (
          <a
            key={t.name}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={track}
            className={`${t.color} text-white text-xs font-semibold rounded-full px-3 py-1.5 transition-colors`}
          >
            {t.name}
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground text-xs font-semibold rounded-full px-3 py-1.5 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
