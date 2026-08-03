import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Marquee } from '@/components/layout/Marquee';
import { getCachedSettings } from '@/lib/data-fetching';
import { headers } from 'next/headers';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { MobileBottomNavbar } from '@/components/layout/MobileBottomNavbar';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  
  let settings = null;
  try {
    settings = await getCachedSettings(hostname);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  const marqueeText = settings?.marqueeText || 'Welcome to ELYJEN! Free shipping on orders over $500.';
  const ui = {
    layout: settings?.uiTemplates?.layout || 'v1',
    navbar: settings?.uiTemplates?.navbar || 'v1',
    footer: settings?.uiTemplates?.footer || 'v1',
  };

  return (
    <>
      {ui.layout !== 'v2' && <Marquee marqueeText={marqueeText} />}
      <Navbar style={ui.navbar} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer style={ui.footer} />
      <ScrollToTop />
      <MobileBottomNavbar />
    </>
  );
}

