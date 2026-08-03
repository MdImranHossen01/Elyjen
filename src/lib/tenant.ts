export async function getTenantDomain(): Promise<string> {
  return 'elyjen.shop';
}

/**
 * Injects the domain into a query or data object for tenant isolation/association.
 */
export function withTenant<T extends object>(data: T, domain: string): T & { domain: string } {
  if (!domain) {
    throw new Error('Tenant domain is required');
  }
  return { ...data, domain };
}

/**
 * Alias for withTenant, used for semantic clarity when associating data.
 */
export function forTenant<T extends object>(data: T, domain: string): T & { domain: string } {
  return withTenant(data, domain);
}

