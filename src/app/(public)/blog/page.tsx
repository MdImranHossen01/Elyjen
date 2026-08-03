import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCachedBlogs, getCachedSettings } from '@/lib/data-fetching';
import { getTenantDomain } from '@/lib/tenant';
import { BlogListingSelector } from '@/components/templates/ServerRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const settings = await getCachedSettings(hostname);
  const brandName = settings?.brandName || 'ELYJEN';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${hostname}`;

  return {
    title: `Blog | ${brandName}`,
    description: `Product ideas, commerce playbooks, and practical updates from ${brandName}.`,
    openGraph: {
      title: `Blog | ${brandName}`,
      description: `Stay updated with the latest news and guides from ${brandName}.`,
      url: `${baseUrl}/blog`,
      siteName: brandName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Blog | ${brandName}`,
      description: `Stay updated with the latest news and guides from ${brandName}.`,
    },
  };
}

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const domain = await getTenantDomain();
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const { page = '1', q = '' } = await searchParams;
  
  // Safe page parsing and clamping
  const parsedPage = parseInt(page, 10);
  const currentPage = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
  
  const limit = 12;

  // Fetch settings first to see if there's a custom limit, or just fetch all
  const settings = await getCachedSettings(hostname);
  
  // Fetch blogs based on domain and a reasonable high limit for listing
  const allBlogs = await getCachedBlogs(domain, 500); // Pass domain

  const filteredBlogs = allBlogs.filter((blog: any) => {
    const searchTerm = q.toLowerCase().trim();
    if (!searchTerm) return true;
    return (
      (blog.title ?? '').toLowerCase().includes(searchTerm) ||
      (blog.metaDescription ?? '').toLowerCase().includes(searchTerm)
    );
  });

  const totalBlogs = filteredBlogs.length;
  const totalPages = Math.ceil(totalBlogs / limit);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  
  const startIndex = (safeCurrentPage - 1) * limit;
  const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + limit);

  return (
    <BlogListingSelector 
      variant={settings?.uiTemplates?.blogListing || 'v1'}
      blogs={paginatedBlogs}
      totalBlogs={totalBlogs}
      currentPage={safeCurrentPage}
      totalPages={totalPages}
      searchTerm={q}
    />
  );
}

