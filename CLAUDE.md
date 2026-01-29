# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Netka CMP (Consent Management Platform) — a Google Tag Manager custom template that integrates cookie consent management with Google Consent Mode v2 for GDPR/PDPA compliance. Maintained by Netka System Co., Ltd.

## Repository Structure

This is a GTM template repository with no build system, package manager, or test runner. The entire template is a single file:

- **template.tpl** — The GTM custom template containing all template logic (info, parameters, sandboxed JS, permissions, tests)
- **metadata.yaml** — Version tracking via SHA and release notes
- **README.md** — Installation and configuration guide

## Architecture

`template.tpl` is a GTM `.tpl` file with these sections (in order):

1. **___INFO___** — Template metadata, display name, brand thumbnail (base64 PNG), container type (WEB)
2. **___TEMPLATE_PARAMETERS___** — User-configurable fields: `apiURL` (CMP endpoint) and `apiKey` (authentication key)
3. **___SANDBOXED_JS_FOR_WEB_TEMPLATE___** — Core logic using GTM sandbox APIs: injects the Netka CMP script and optionally an AutoBlock script, manages consent state for 5 types (ad_storage, analytics_storage, functionality_storage, personalization_storage, security_storage)
4. **___WEB_PERMISSIONS___** — Scoped permissions: script injection limited to `*.netkasystem.co.th` and `*.pdpanetka.com`, consent read/write, cookie access (`cookieconsent_status`, `cconsent`), data layer writes, debug logging
5. **___TESTS___** — Test scenarios (currently empty)
6. **___NOTES___** — Creation timestamp

## Key GTM Sandbox APIs Used

`injectScript`, `setDefaultConsentState`, `updateConsentState`, `callInWindow`, `copyFromWindow`, `setInWindow`, `getCookieValues`, `gtagSet`, `logToConsole`, `queryPermission`, `callLater`

## Development Notes

- No build/lint/test commands exist — the template is imported directly into GTM
- Version is tracked by SHA in `metadata.yaml`, update it when making changes
- Script injection is domain-restricted for security; any new external scripts require adding URL patterns to `___WEB_PERMISSIONS___`
- The `___TESTS___` section supports GTM template test scenarios but has no cases defined yet
