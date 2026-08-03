/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from '@/components/ui/social-icons';
import { Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DeveloperLogo from '@/components/ui/developerlogo';
import { useSettings } from '@/components/SettingsProvider';
import * as SocialIcons from '@/components/ui/social-icons';
import { Circle } from 'lucide-react';

const socialIconMap: Record<string, any> = {
  facebook: SocialIcons.Facebook || Circle,
  twitter: SocialIcons.Twitter || SocialIcons.X || Circle,
  instagram: SocialIcons.Instagram || Circle,
  youtube: SocialIcons.Youtube || Circle,
  linkedin: SocialIcons.Linkedin || Circle,
  tiktok: SocialIcons.Tiktok || Circle,
  whatsapp: SocialIcons.Whatsapp || Circle,
};

export default function FooterV2() {
  const currentYear = new Date().getFullYear();
  const settings = useSettings();
  const socialLinks = settings?.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => v);

  const footerNav = settings?.footerNavigation && settings.footerNavigation.length > 0 
    ? settings.footerNavigation 
    : [
        { label: 'Shop All', href: '/shop' },
        { label: 'New Arrivals', href: '/shop?filter=new' },
        { label: 'Order Tracking', href: '/track-order' },
        { label: 'Contact Support', href: '/contact' }
      ];

  return (
    <footer className="bg-background border-t border-muted text-foreground pt-16 pb-8 px-6 font-jost">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center lg:text-left lg:grid lg:grid-cols-12 lg:gap-16 mb-16 space-y-12 lg:space-y-0">
          
          {/* Brand Essence */}
          <div className="lg:col-span-4 space-y-6 flex flex-col items-center lg:items-start">
            <Link href="/" className="text-4xl font-black tracking-tighter hover:text-primary transition-all inline-block italic uppercase">
              {settings?.brandName || 'ELYJEN'}<span className="text-primary">.</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed font-medium">
              Pushing the boundaries of design. Born in the heart of Dhaka, engineering for the world.
            </p>
          </div>

          {/* Dynamic Navigation */}
          <div className="lg:col-span-5 w-full">
             <div className="flex flex-col items-center lg:items-start space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Quick Links</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 w-full lg:w-auto">
                   {footerNav.map(link => (
                     <li key={link.label}>
                        <Link href={link.href} className="text-sm font-bold text-muted-foreground hover:text-primary transition-all whitespace-nowrap">
                           {link.label}
                        </Link>
                     </li>
                   ))}
                </ul>
             </div>
          </div>

          {/* Social Icons & Policy Links */}
          <div className="lg:col-span-3 space-y-6 flex flex-col items-center lg:items-start">
             <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary text-center lg:text-left">Connect With Us</h4>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                    {hasSocialLinks ? (
                      Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        const Icon = socialIconMap[platform];
                        if (!Icon) return null;

                        return (
                          <Link 
                            key={platform} 
                            href={url as string} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full border border-muted flex items-center justify-center hover:bg-primary hover:border-primary transition-all group"
                            title={platform}
                          >
                              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
                          </Link>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Follow us on social media for updates.</p>
                    )}
                </div>
                
                {/* Privacy & Terms Moved Here */}
                <div className="flex items-center justify-center lg:justify-start gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pt-2">
                   <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                   <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                </div>
             </div>
          </div>
        </div>

        {/* Bottom Bar - Reduced Padding & Smart Layout */}
        <div className="pt-6 border-t border-muted flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
           <p className="text-center md:text-left">© {currentYear} {settings?.brandName || 'ELYJEN'} CO. ALL RIGHTS RESERVED.</p>
           <div className="flex items-center gap-4">
             <DeveloperLogo className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all scale-90 md:scale-100" />
           </div>
        </div>
      </div>
    </footer>
  );
}

