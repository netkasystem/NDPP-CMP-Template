# Netka CMP: Google Consent Mode v2 and Google tag gateway

## Scope and legal notice

Google Consent Mode changes how Google tags behave based on consent signals. It
does not by itself make a site compliant with GDPR, Thailand PDPA, or another
law. Each customer remains responsible for its legal basis, banner wording,
purpose and vendor disclosures, region policy, tag configuration, and legal
review.

Official Google references:

- [Consent Mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Set up Consent Mode on websites](https://developers.google.com/tag-platform/security/guides/consent)
- [Create a Consent Mode template](https://developers.google.com/tag-platform/tag-manager/templates/consent-apis)
- [Google tag gateway for advertisers](https://developers.google.com/tag-platform/tag-manager/gateway)

## Consent type mapping

| Google consent type | Default Netka purpose |
|---|---|
| `ad_storage` | Targeting/Advertising |
| `ad_user_data` | Targeting/Advertising data sent to Google |
| `ad_personalization` | Targeting/Advertising personalization |
| `analytics_storage` | Performance/Analytics |
| `functionality_storage` | Functional |
| `personalization_storage` | Targeting/Personalization |
| `security_storage` | Necessary/Security |

Reject All keeps all optional Google consent types denied. Accept All grants
only purposes described to the visitor. A granular choice maps each purpose
independently and is never converted to a universal grant.

Social Media alone does not grant Google advertising consent. A social service
used for advertising must also be classified and disclosed under
Targeting/Advertising.

## Choose Basic or Advanced mode

Netka provides two distinct deployment paths.

### Basic mode: block Google tags before consent

Basic mode disables Consent Mode `default` and `update` commands and blocks GTM
until the visitor makes an affirmative choice. The AutoBlock bootstrap must be
placed directly in the page before every Google tag or GTM container:

```html
<script>
window.NKS_CONSENT_MODE_CONFIG = { mode: "basic" };
</script>
<script src="https://cookiebanner.pdpanetka.com/nksAutoBlock.min.js"></script>
```

Load the customer-specific Netka banner immediately after AutoBlock. Do not
load GTM or `gtag.js` above this bootstrap. After Accept, Netka loads the saved
GTM ID; Reject keeps it blocked. Returning accepted and rejected choices must
be checked in browser QA.

AutoBlock also neutralizes static `gtm.js`, `gtag.js`, Google Analytics, Ads,
and DoubleClick script URLs in Basic mode. A monolithic GTM container is
released only after Accept All (or all configured optional purposes are
granted). A partial granular choice does not release the whole container,
because doing so could activate tags for an ungranted purpose. Customers that
need granular Basic loading must separate tags by purpose and apply equivalent
purpose-specific blocking/triggers during implementation review.

A GTM template cannot retroactively block the GTM container that is already
executing it. Therefore, do not describe a CMP tag installed inside GTM as a
Basic-mode installation. Use the direct pre-GTM bootstrap above.

### Advanced mode: Consent Mode defaults and updates

Advanced mode loads consent-aware Google tags with explicit defaults and sends
updates after Accept, Reject, granular Save, or withdrawal:

```html
<script>
window.NKS_CONSENT_MODE_CONFIG = { mode: "advanced" };
</script>
```

For codeless GTM setup, install the Netka CMP Community Template and fire it on
**Consent Initialization - All Pages**. Configure the global and regional rows
described below. Google tags may send limited cookieless measurements while
the applicable consent signals remain denied.

Choosing a mode is a customer policy decision. Advanced mode must not be
described as automatically compliant with a law.

## Regional defaults and no-banner measurement

Use the same reviewed region policy for banner visibility and Consent Mode
defaults. In the Netka GTM template, add:

| Region | Granted consent types | Denied consent types |
|---|---|---|
| blank/global | `ad_storage,analytics_storage,ad_user_data,ad_personalization` | blank |
| banner regions, for example `DE,FR` | blank | `ad_storage,analytics_storage,ad_user_data,ad_personalization` |

The global row applies where no banner appears. The more-specific regional row
requires a choice where the banner is shown. If regional rows are present but
the global row is missing, the template inserts a denied global fallback.
Duplicate or invalid regional assignments also fail closed.

For a direct-script deployment, set the equivalent policy before AutoBlock:

```html
<script>
window.NKS_CONSENT_MODE_CONFIG = {
  mode: "advanced",
  bannerRegions: ["DE", "FR"],
  grantOutsideBannerRegions: true,
  waitForUpdate: 2000
};
</script>
```

Replace the example regions with an approved policy. A timeout, missing setting,
or geo error is not proof that a visitor is outside a region and must fail
closed. A stored user rejection takes priority over a later no-banner result.

## Google-ready non-TCF banner

When Consent Mode is enabled without TCF, select the **Google-ready banner
template** in the Netka GUI. It must:

1. explain analytics and, where enabled, personalization/advertising purposes;
2. provide an affirmative Accept option and a clear Reject/customize path;
3. expose [Google's Business Data Responsibility page](https://business.safety.google/privacy/) inside the banner or its in-banner details;
4. leave optional categories off until affirmative consent where opt-in applies;
5. let the visitor reopen preferences and withdraw consent.

The generated configuration uses `consentMode.googleReadyTemplate: true`. Netka
then preserves the Google privacy link, Accept/Reject controls, optional-off
defaults, and a link-capable banner layout. Confirm the rendered GUI and
generated configuration during QA.

## Verify defaults and updates

Use GTM Preview, Tag Assistant, browser storage, and the Netka diagnostic report
on every public landing page. Verify that:

- Advanced defaults contain `ad_storage`, `analytics_storage`, `ad_user_data`,
  and `ad_personalization` before any Google tracking event;
- Basic mode produces no Consent Mode default/update commands and loads Google
  tags only after Accept;
- Accept, Reject, granular Save, and withdrawal produce the expected behavior;
- returning accepted and rejected choices are restored;
- no optional cookie is written before the applicable choice;
- the banner appears inside configured regions and outside-region behavior
  follows the reviewed policy;
- the Netka Developer ID is visible in the Google debugging tools.

A **late consent** result means that the CMP default or TCF stub was observed
after a Google tag began loading. A visible banner does not make this warning
safe to ignore.

## Google tag gateway and late consent

Google tag gateway (GTG) can serve Google tags through a site's first-party
infrastructure. One-click CDN enrollment can alter where and when a tag is
injected, so the CMP may not control import order.

When Netka diagnostics report late consent:

1. Inspect the CDN/tagging configuration and Google's [GTG setup documentation](https://developers.google.com/tag-platform/tag-manager/gateway).
2. Use Tag Assistant and browser Network tools to identify the first-party GTG
   path and confirm whether it begins before the consent default.
3. If GTG is confirmed, prefer U+C/Advanced Consent Mode for consent-aware tags
   and configure Data Transmission Controls and Global Consent Defaults for the
   customer's needs and reviewed region policy.
4. Alternatively, migrate the implementation into one GTM container and deploy
   GTM through GTG, or configure GTG manually so the customer controls import
   order.
5. Re-run diagnostics on every landing page, including campaign and deep links.

U+C/Advanced Consent Mode is Netka's recommended path for GTG-enabled,
consent-aware tags because it is compatible with manually controlled GTG.
Basic mode remains available when Google tags must be blocked until consent.

## Support escalation

Contact Netka support first for CMP, Consent Mode, GTM template, diagnostics, or
GTG troubleshooting. Provide affected URLs, scan results, GTM container/version
or gtag snippet, Tag Assistant evidence, timestamps, tested regions, and
screenshots. Never place passwords or audit credentials in a public repository.

- Email: `support@netkasystem.co.th`
- Company: [Netka System](https://netkasystem.com)
