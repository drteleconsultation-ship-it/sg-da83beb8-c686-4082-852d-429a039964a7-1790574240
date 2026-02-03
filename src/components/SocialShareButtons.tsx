import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SocialShareButtons: React.FC = () => {
  const { toast } = useToast();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = "Dr Deogade Clinic - Quality Healthcare Services";
  const description = "Book your appointment with Dr. Rikki Deogade - Expert in Dermatology, Gynecology, and General Medicine";

  const handleWhatsAppShare = () => {
    const text = `${title}\n\n${description}\n\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Clinic link has been copied to clipboard",
    });
  };

  return (
    <div className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 md:gap-3">
      {/* Share Icon Button - Primary Color */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopyLink}
        className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary text-white hover:bg-primary/90 shadow-lg border-2 border-primary transition-all duration-300 hover:scale-110"
        title="Copy Link"
      >
        <Share2 className="h-4 w-4 md:h-5 md:w-5" />
      </Button>

      {/* WhatsApp Button - Green */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleWhatsAppShare}
        className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#25D366] text-white hover:bg-[#20BA5A] shadow-lg border-2 border-[#25D366] transition-all duration-300 hover:scale-110"
        title="Share on WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 md:h-5 md:w-5"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </Button>

      {/* Facebook Button - Blue */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleFacebookShare}
        className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#1877F2] text-white hover:bg-[#0C63D4] shadow-lg border-2 border-[#1877F2] transition-all duration-300 hover:scale-110"
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4 md:h-5 md:w-5" />
      </Button>

      {/* Twitter/X Button - Black */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleTwitterShare}
        className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-black text-white hover:bg-gray-800 shadow-lg border-2 border-black transition-all duration-300 hover:scale-110"
        title="Share on Twitter"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 md:h-5 md:w-5"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </Button>
    </div>
  );
};

export default SocialShareButtons;