# Netka CMP - Google Tag Manager Template

[![Template Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/netkasystem/NDPP-CMP-Template)
[![GTM](https://img.shields.io/badge/GTM-Compatible-green.svg)](https://tagmanager.google.com/)

## 📋 Overview

Netka CMP is a Google Tag Manager custom template that integrates cookie consent management with Google Consent Mode. Consent Mode changes how Google tags behave based on consent signals; legal compliance still depends on each organization's policies, configuration, notices, and applicable law.

## ✨ Features

- 🍪 **Cookie Consent Management** - Manage user consent preferences
- 🔒 **Google Consent Mode v2** - Full support for Google's consent framework
- 🎯 **Easy GTM Integration** - Simple setup through Google Tag Manager
- 📊 **Consent State Tracking** - Real-time consent state updates
- 🚀 **Auto-Block Scripts** - Optional automatic script blocking
- 🌐 **Multi-language Support** - Customizable for different regions

## 🚀 Installation

### Method 1: Import Template File

1. Download the `template.tpl` file from this repository
2. Open your Google Tag Manager container
3. Navigate to **Templates** → **Tag Templates**
4. Click **New** → **More Actions** → **Import**
5. Select the downloaded `.tpl` file
6. Save the template

### Method 2: Manual Setup

1. Go to Google Tag Manager
2. Navigate to **Templates** → **Tag Templates** → **New**
3. Copy the content from `template.tpl`
4. Paste into the template editor
5. Save the template

## ⚙️ Configuration

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| **Netka CMP URL** | Tenant-specific HTTPS API endpoint for cookie settings | `https://customer.pdpanetka.com/api/cookie/cookiesetting.js` |
| **API Key** | Your unique Netka CMP API key | Provided by Netka System |

Choose the endpoint by environment:

| Environment | Endpoint rule |
|---|---|
| Google CMP review/certification | Use the externally accessible `https://ndppdev.netkasystem.co.th/api/cookie/cookiesetting.js` audit endpoint and audit key supplied by Netka. |
| Commercial SaaS | Use the customer's concrete HTTPS tenant host, such as `https://customer.pdpanetka.com/api/cookie/cookiesetting.js`. |

`ndppdev.netkasystem.co.th` is Netka's dedicated environment for Google CMP
review and certification. It uses the same CMP codebase, release artifacts,
consent logic, GTM integration, and public Cookie Banner CDN assets as
tenant-specific commercial deployments under `pdpanetka.com`. The review
environment differs only in hostname and infrastructure provisioning: it uses
a shared Netka review host instead of a dedicated customer tenant environment.

Production customers use concrete tenant-specific HTTPS hosts. The literal
`*.pdpanetka.com` value is an Inject Script permission pattern, not a URL to
enter in the tag. Never copy an audit key into a customer tenant configuration
or commit any API key to source control. The audit environment does not use an
audit-only consent bypass or different Consent Mode behavior.

### Setup Instructions

1. **Create a New Tag**
   - In GTM, go to **Tags** → **New**
   - Choose **Netka CMP** as the tag type

2. **Configure Settings**
   - Enter the concrete **Netka CMP URL** for the selected environment
   - Add your **API Key** (obtain from Netka System)

3. **Set Trigger**
   - Use **Consent Initialization - All Pages** so consent defaults run before other tags.
   - Do not use **Initialization - All Pages**, **All Pages**, tag priority, or firing order as a substitute for the Consent Initialization trigger.

4. **Verify Before Publishing**
   - In GTM Preview, confirm the Netka CMP tag fires during **Consent Initialization**.
   - Confirm Advanced-mode defaults exist before `gtm.js` or another Google tracking event.
   - Confirm Basic-mode installations use the direct pre-GTM bootstrap described in the linked guide; a CMP tag inside GTM cannot block the container that is already running it.

## 📝 Template Parameters

```javascript
{
  "apiURL": "https://customer.pdpanetka.com/api/cookie/cookiesetting.js",
  "apiKey": "YOUR_TENANT_API_KEY"
}
```

For Google review and certification, replace `apiURL` with
`https://ndppdev.netkasystem.co.th/api/cookie/cookiesetting.js` and use the
separately issued audit key. This changes the review host and provisioning,
not the CMP release or consent behavior under test.

## 🔐 Permissions

The template requires the following permissions:

- ✅ **Inject Script** - To load Netka CMP scripts
- ✅ **Access Consent** - To read/write consent states
- ✅ **Logging** - For debugging (debug mode only)
- ✅ **Access Globals** - For consent state management
- ✅ **Write Data Layer** - To update consent information
- ✅ **Get Cookies** - To read consent cookies

### Consent Types Managed

- `ad_storage` - Advertising cookies
- `analytics_storage` - Analytics cookies
- `ad_user_data` - Sending user data to Google for advertising
- `ad_personalization` - Personalized advertising
- `functionality_storage` - Functional cookies
- `personalization_storage` - Personalization cookies
- `security_storage` - Security cookies

### Regional consent defaults

Configure the **Regional consent defaults** table instead of applying denied defaults to every visitor regardless of location.

For a deployment where the banner appears in Germany and France, add these rows:

| Region | Granted consent types | Denied consent types |
|---|---|---|
| *(blank/global)* | `ad_storage,analytics_storage,ad_user_data,ad_personalization` | *(blank)* |
| `DE,FR` | *(blank)* | `ad_storage,analytics_storage,ad_user_data,ad_personalization` |

The blank row applies outside the listed banner regions. The more specific regional row takes precedence inside Germany and France. Replace the example regions with the same reviewed policy used by the Netka banner; do not copy it to production unchanged.

The global row is an explicit policy decision. If regional rows are configured without a blank/global row, the template automatically adds a global denied fallback. Duplicate region assignments also make the configuration fall back to global denied. This prevents an omitted or ambiguous row from becoming an accidental grant. If measurement should continue where the banner does not appear, add and review the blank/global granted row explicitly.

`wait_for_update` is constrained to 500–10000 milliseconds; invalid or lower values use 500 milliseconds because the CMP loads asynchronously.

The template restores the saved `cconsent` cookie at page load and installs `nksGtmConsentUpdate` before the CMP script is injected. Accept, reject, granular changes, and revocation are sent through GTM's `updateConsentState` API. The page-side compatibility listener `addNksConsentListener` remains available to non-template consumers.

## 🎯 Usage Example

After setup, the tag will:

1. Load the Netka CMP script on page load
2. Display or suppress the banner according to the reviewed regional policy
3. Capture user consent choices
4. Update Google Consent Mode accordingly
5. Store consent preferences in cookies

## 🐛 Debugging

Enable **Debug Mode** in GTM Preview:

```javascript
// Check console logs for:
// "NETKA.CMP > AutoBlock injected"
// "NETKA.CMP > Netka CMP Script does not have permission to be injected."
```

## 📚 Additional Resources

- [Netka Consent Mode v2, Basic/Advanced, regional and GTG guide](docs/google-consent-mode-v2-and-gtg.md)
- [Google Consent Mode Documentation](https://developers.google.com/tag-platform/security/guides/consent)
- [GTM Custom Templates Guide](https://developers.google.com/tag-platform/tag-manager/templates)

## 🤝 Support

For technical support or questions:

- 📧 Email: support@netkasystem.co.th
- 🌐 Website: https://netkasystem.com
- 📱 Contact: Netka System Support Team

## 📄 License

This template is licensed under the terms specified in the LICENSE file.

## 🔄 Version History

### Version 1.0
- Initial release
- Google Consent Mode v2 support
- Basic consent management functionality
- Multi-consent type support

## ⚠️ Important Notes

- Ensure your API key is valid and active
- Keep Google review credentials separate from customer SaaS credentials
- Use a concrete SaaS tenant hostname; never enter `*.pdpanetka.com`
- Fire the GTM template on **Consent Initialization - All Pages** only
- Test in GTM Preview mode before publishing
- Comply with local data privacy regulations (GDPR/PDPA)
- Keep the template updated for security patches

## 🛠️ Development

This template is maintained by Netka System. For contributions or issues:

Run the local sandbox behavior suite with Node.js 18 or newer:

```shell
node --test test/template-runtime.test.js
```

1. Fork this repository
2. Create a feature branch
3. Submit a pull request with detailed description

---

**Netka System**
