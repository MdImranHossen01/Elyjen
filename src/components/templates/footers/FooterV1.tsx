import Link from 'next/link';
import connectToDatabase from "@/lib/db";
import GlobalSettings from "@/models/GlobalSettings";
import * as SocialIcons from '@/components/ui/social-icons';
import {
  Circle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import DeveloperLogo from '@/components/ui/developerlogo';


async function getGlobalSettings() {
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const hostname = headersList.get('host') || 'localhost';
    const { getCachedSettings } = await import('@/lib/data-fetching');
    return await getCachedSettings(hostname);
  } catch (error) {
    console.error('Error fetching settings for footer:', error);
    return null;
  }
}

const socialIconMap: Record<string, any> = {
  facebook: SocialIcons.Facebook || Circle,
  twitter: SocialIcons.Twitter || SocialIcons.X || Circle,
  instagram: SocialIcons.Instagram || Circle,
  youtube: SocialIcons.Youtube || Circle,
  linkedin: SocialIcons.Linkedin || Circle,
  tiktok: SocialIcons.Tiktok || Circle,
  whatsapp: SocialIcons.Whatsapp || Circle,
};

const socialLabels: Record<string, string> = {
  facebook: 'Facebook',
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
};

export default async function FooterV1() {
  const settings = await getGlobalSettings();
  const socialLinks = settings?.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => v);

  return (
    <footer className="border-t bg-background pt-12 mt-10">
      <div className="container mx-auto px-4 md:px-0">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center text-center md:items-start md:text-left gap-4">
            <Logo textClassName="text-xl md:text-2xl" />
            <p className="text-sm text-muted-foreground w-full md:w-4/5">
              Your ultimate destination for quality products across multiple categories including groceries, electronics, and fashion.
            </p>
            {hasSocialLinks && (
              <div className="flex items-center gap-4 mt-2">
                {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null;
                const Icon = socialIconMap[platform];
                if (!Icon) return null;

                let safeUrl = "#";
                if (url && url !== '#') {
                  try {
                    const parsedUrl = new URL(url as string);
                    if (['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
                      safeUrl = url as string;
                    }
                  } catch (e) {
                    if (typeof url === 'string' && url.startsWith('/')) {
                      safeUrl = url;
                    }
                  }
                }

                return (
                  <a
                    key={platform}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
                    aria-label={socialLabels[platform] || platform}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Categories</h4>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/shop?category=mens-clothing" className="hover:text-primary transition-colors">Men's Clothing</Link>
              </li>
              <li>
                <Link href="/shop?category=womens-clothing" className="hover:text-primary transition-colors">Women's Clothing</Link>
              </li>
              <li>
                <Link href="/shop?category=footwear" className="hover:text-primary transition-colors">Footwear</Link>
              </li>
              <li>
                <Link href="/shop?category=home-lifestyle" className="hover:text-primary transition-colors">Home & Lifestyle</Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Information</h4>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Contact</h4>
            <ul className="grid gap-3 text-sm text-muted-foreground">
              <li className="flex items-start justify-center md:justify-start gap-3">
                <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                <span>{settings?.contact?.address || '123 ELYJEN Avenue'}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Phone size={16} className="text-primary shrink-0" />
                <span>{settings?.contact?.phone || '+880 1234-567890'}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Mail size={16} className="text-primary shrink-0" />
                <span>{settings?.contact?.email || 'support@bddukan.shop'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t py-6 sm:flex-row text-sm text-muted-foreground gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p>© {new Date().getFullYear()} {settings?.brandName || 'ELYJEN'}. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6">
            <DeveloperLogo />
          </div>
        </div>
      </div>
    </footer>
  );
}

