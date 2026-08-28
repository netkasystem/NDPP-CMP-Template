/*
 * Test-site configuration for the CMP Partner Program audit page.
 *
 * Fill these in before enabling GitHub Pages. Both values are public by
 * construction — the banner key travels in the page source of every site that
 * uses the dynamic integration, and a GA4 measurement ID is visible in any
 * page that loads gtag. That is only acceptable because BOTH belong to
 * throwaway resources created for this audit:
 *
 *   - cmpKey  : a banner record created solely for this test site, whose
 *               DiscoveryDomain is this page's host. Retire it after
 *               certification; never paste a customer's key here.
 *   - ga4     : a GA4 property created solely for this test site, so the
 *               auditors' traffic never reaches Netka's real analytics.
 *
 * See README.md in this folder for the full setup.
 */
window.NKS_TEST_CONFIG = {
  // The tenant host that serves the banner configuration.
  cmpEndpoint: "https://ndppdev.netkasystem.co.th/api/cookie/cookiesetting",

  // Key of the banner record on the ndppdev review host, confirmed public by the
  // team. Stored decoded — the page applies encodeURIComponent once, so a
  // pre-encoded value here would arrive double-encoded and fail to decrypt.
  cmpKey: "FGhGHEEv6o6UXUBA68UWtA==",

  // GA4 measurement ID created for this page (property kept separate from the
  // corporate G-9EXHFKSLTQ so reviewer traffic never reaches real analytics).
  ga4: "G-4MCPSVLMM3",

  // Container for the GTM route page; the gtag page ignores it.
  gtm: "GTM-5N3PMSTH"
};
