# CMP Partner Program test site

`index.html` is the public page Google's reviewers open. It runs the Netka consent banner over a **gtag** implementation with Consent Mode v2 and carries nothing else.

It answers the test-site question in the application: a gtag-based implementation, with the banner visible from every location, on a host that stays put.

## Why it lives here rather than on the marketing site

The corporate site loads Mixpanel with autocapture and session recording **above** the CMP, where AutoBlock cannot block it, and marketing can change that page at any time during the review window. This page is owned by engineering, has no third-party tags, and its history is in Git.

## Setup

1. **Create a banner record for this page only.** In the NDPP console, add a banner whose `DiscoveryDomain` is exactly this page's host — the consent endpoint rejects a submission whose host or `Origin` does not match. Enable the purposes the review needs: Necessary, Performance, Functional and Targeting, so *Accept all* demonstrates every Google consent signal. Keep Coverage on Worldwide.
2. **Create a GA4 property for this page only.** Never reuse the corporate measurement ID: reviewer traffic would land in Netka's real analytics.
3. **Fill in `config.js`** with the tenant endpoint, the banner key and the GA4 ID.
4. **GitHub Pages** publishes this repository from the `/docs` folder on `main`, which is why the test site lives here rather than at the repository root. The page is at `https://netkasystem.github.io/NDPP-CMP-Template/cmp-test/`.
5. **Optional custom domain.** Use a subdomain such as `cmp-demo.netkasystem.com` — never the apex, which serves the marketing site. Add `cmp-demo CNAME netkasystem.github.io.` to the **public** zone *and* to the internal AD zone: the name is split-horizon, so a record in only one place leaves either the reviewers or the office unable to open it. Enter the domain in the Pages settings, let GitHub write the `CNAME` file, then enable Enforce HTTPS.
6. **Copy the published URL into the application** and into the runtime evidence checklist in the CookieBanner repository.

## Two pages, one per integration route

The Test Site section asks for the banner "with consent mode and Google tags deployed (for GTM and gtag)", and Netka recommends GTM to its customers. Both routes therefore get a page, kept apart so a reviewer always knows which integration is on screen:

| Page | Route | Ids |
|---|---|---|
| `cmp-test/` | gtag, the implementation the clarification asks for first | `G-4MCPSVLMM3` |
| `cmp-test-gtm/` | Google Tag Manager, the integration Netka recommends | `GTM-5N3PMSTH` (NDPP-CMP) |

They share `config.js` and the consent readout. Never put both a container and a gtag snippet on one page: each would emit its own consent default and the reviewer could not tell which one the CMP produced.

The container also carries the other evidence the application needs — the Gallery import, the Template Editor tests and the shareable Preview link — so it must have the Netka CMP tag configured on the **Consent Initialization – All Pages** trigger before this page behaves correctly.

## About the key in `config.js`

The key belongs to a banner record on **`ndppdev.netkasystem.co.th`**, the review host, and the team has confirmed it is public. It has to be committed: a static page on GitHub Pages has nowhere else to read it from, and in the dynamic integration the key appears in the page source of every site that uses it anyway.

Two things follow, and neither is optional:

- **Never put a customer tenant's key here.** This repository is public and its history is permanent, so a key committed once cannot be taken back by editing the file.
- **Retire this banner record once certification is settled**, and keep its `DiscoveryDomain` pinned to whatever host actually serves these pages. If the site later moves to a custom domain, update `DiscoveryDomain` at the same time or `POST /api/cookie/consent` will start rejecting submissions: it requires the payload host and the browser `Origin` to match the configured domain exactly.

## Load order — do not rearrange

```
window.NKS_CONSENT_MODE_CONFIG   →  read synchronously by AutoBlock
nksAutoBlock.min.js              →  issues the Consent Mode default
banner configuration fetch       →  brings in the banner and preference centre
gtag.js                          →  must follow the default command
```

Anything added above AutoBlock is loaded by the parser before the CMP exists and cannot be blocked. That is what disqualified the marketing site, and it would disqualify this page just as fast.

The fetch drops the AutoBlock tag and the config script that the API response repeats, so AutoBlock runs once. Two loads would emit a second, late consent default — the pattern our own scanner flags.

## Checks before submitting the URL

- [ ] The page opens from outside the Netka network, with no VPN and no login.
- [ ] The banner appears; testers in at least three widely separated countries confirm it.
- [ ] The Network panel shows exactly **one** `nksAutoBlock.min.js` request.
- [ ] The readout on the page shows one `consent default` with all four required types denied, before the Google tag.
- [ ] Accept produces one `update` granting the accepted purposes; Reject keeps them denied; the preference centre writes a per-purpose update.
- [ ] Withdrawing consent returns the signals to denied.
- [ ] Tag Assistant shows developer ID `dYmE5Zm`.
