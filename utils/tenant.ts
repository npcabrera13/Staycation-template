export const getTenantId = (): string => {
  if (typeof window === 'undefined') return 'default_tenant';

  // 1. Check URL parameters first for easy testing (e.g. ?tenant=hotel1)
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }

  const hostname = window.location.hostname;
  
  // 2. Localhost fallback
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'default_tenant';
  }

  // 3. Subdomain extraction
  // Example: hotel1.staycation.com -> tenantId = 'hotel1'
  // Example: hotel1.pages.dev -> tenantId = 'hotel1'
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0]; // Returns 'hotel1'
  }

  // 4. Ultimate fallback
  return 'default_tenant';
};
