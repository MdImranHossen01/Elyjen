/**
 * Cloudflare Edge Cache Purge Utility for Elyjen
 * Automatically clears Cloudflare Cache when products, banners, blogs, or settings change.
 * Reads credentials strictly from environment variables:
 * - process.env.CLOUDFLARE_ZONE_ID
 * - process.env.CLOUDFLARE_API_TOKEN
 * Safe, asynchronous, non-blocking, and never crashes the API caller.
 */

interface CloudflarePurgeOptions {
  zoneId?: string;
  apiToken?: string;
  files?: string[];
}

export async function purgeCloudflareCache(options?: CloudflarePurgeOptions | string[]): Promise<void> {
  const zoneId = (options && !Array.isArray(options) ? options.zoneId : undefined) || process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = (options && !Array.isArray(options) ? options.apiToken : undefined) || process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
    
    let payload: any = { purge_everything: true };
    if (Array.isArray(options) && options.length > 0) {
      payload = { purge_everything: true };
    } else if (options && !Array.isArray(options) && options.files && options.files.length > 0) {
      payload = { files: options.files };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as any;

    if (response.ok && data?.success) {
      console.log(`[Cloudflare Purge] Successfully purged cache for Elyjen zone: ${zoneId.slice(0, 6)}...`);
    } else {
      console.warn(`[Cloudflare Purge] Warning from Cloudflare API:`, data?.errors || data);
    }
  } catch (error: any) {
    console.error(`[Cloudflare Purge] Error triggering purge:`, error?.message || error);
  }
}

