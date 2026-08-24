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
| **Netka CMP URL** | API endpoint for cookie settings | `https://ndppdev.netkasystem.co.th/api/cookie/cookiesetting.js` |
| **API Key** | Your unique Netka CMP API key | Provided by Netka System |

The default `ndppdev.netkasystem.co.th` URL is the controlled endpoint used for
Google CMP review and certification testing. Commercial SaaS customers use a
tenant-specific HTTPS host under `*.pdpanetka.com` (for example,
`https://customer.pdpanetka.com/...`); the literal wildcard is a permission
pattern, not a URL to enter in the tag. Both host families are allowlisted by
the template's Inject Script permission.

### Setup Instructions

1. **Create a New Tag**
   - In GTM, go to **Tags** → **New**
   - Choose **Netka CMP** as the tag type

2. **Configure Settings**
   - Enter your **Netka CMP URL** (default provided or custom endpoint)
   - Add your **API Key** (obtain from Netka System)

3. **Set Trigger**
   - Use **Consent Initialization - All Pages** so consent defaults run before other tags

4. **Advanced Settings** (Optional)
   - Tag firing priority: Set to highest (e.g., 999)
   - Firing order: Before other tags that require consent

## 📝 Template Parameters

```javascript
{
  "apiURL": "https://ndppdev.netkasystem.co.th/api/cookie/cookiesetting.js",
  "apiKey": "YOUR_API_KEY_HERE"
}
```

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

If regional policy or geo lookup fails, do not treat the failure as an outside-region grant. Keep a denied fallback and surface the banner or fail closed.

The template restores the saved `cconsent` cookie at page load and registers `addNksConsentListener` after the CMP script loads. Accept, reject, granular changes, and revocation are sent through GTM's `updateConsentState` API.

## 🎯 Usage Example

After setup, the tag will:

1. Load the Netka CMP script on page load
2. Display the consent banner to users
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
- Test in GTM Preview mode before publishing
- Comply with local data privacy regulations (GDPR/PDPA)
- Keep the template updated for security patches

## 🛠️ Development

This template is maintained by Netka System. For contributions or issues:

1. Fork this repository
2. Create a feature branch
3. Submit a pull request with detailed description

---

**Netka System**
