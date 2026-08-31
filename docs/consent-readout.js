/*
 * Consent readout shared by the test pages.
 *
 * Shows the consent state a reviewer would otherwise need a debugger to see: the
 * gtag route's dataLayer commands where they exist, and otherwise the state
 * Google's tags actually read. It only reads; nothing here changes consent.
 */
(function () {
  "use strict";

  var TYPES = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage",
               "functionality_storage", "personalization_storage", "security_storage"];
  var REQUIRED = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"];

  function consentCommands() {
    var dl = window.dataLayer || [];
    var out = [];
    for (var i = 0; i < dl.length; i++) {
      var a = dl[i];
      if (a && a[0] === "consent" && (a[1] === "default" || a[1] === "update")) {
        out.push({ index: i, kind: a[1], payload: a[2] || {} });
      }
    }
    return out;
  }

  function firstGoogleTagIndex() {
    var dl = window.dataLayer || [];
    for (var i = 0; i < dl.length; i++) {
      var a = dl[i];
      if (!a) continue;
      if (a[0] === "config" || a[0] === "js") return i;
      if (a["gtm.start"]) return i;
    }
    return -1;
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Where the consent state actually lives depends on the integration.
  // gtag pushes ['consent','default',…] into dataLayer, so it is visible there.
  // The GTM route calls setDefaultConsentState, which the container applies
  // internally and never pushes — but both end up in google_tag_data.ics, which
  // is what a Google tag reads. Report that, so this page tells the truth on
  // either route instead of waiting forever for a command that never arrives.
  function effectiveState() {
    var gtd = window.google_tag_data || {};
    var entries = (gtd.ics && gtd.ics.entries) || null;
    if (!entries) return null;
    var out = {};
    for (var k in entries) {
      if (!Object.prototype.hasOwnProperty.call(entries, k)) continue;
      var e = entries[k] || {};
      var has = e.update !== undefined && e.update !== null;
      out[k] = { value: has ? e.update : e.default, source: has ? "update" : "default" };
    }
    return out;
  }

  function renderState(el) {
    var state = effectiveState();
    if (!state) return false;
    var keys = Object.keys(state);
    if (!keys.length) return false;

    var allDenied = REQUIRED.every(function (k) { return state[k] && state[k].value === false; });
    var anyUpdate = keys.some(function (k) { return state[k].source === "update"; });

    var html = '<p><span class="pill ' + (anyUpdate ? "pill-ok" : allDenied ? "pill-ok" : "pill-warn") + '">' +
      (anyUpdate ? "Your choice has been applied" : allDenied ? "Denied until you choose" : "Some purposes are granted before a choice") +
      "</span></p>";
    html += "<table><thead><tr><th>consent type</th><th>state</th><th>from</th></tr></thead><tbody>";
    TYPES.forEach(function (t) {
      if (!state[t]) return;
      var v = state[t].value;
      html += "<tr><td>" + t + "</td><td class='" + (v ? "granted" : "denied") + "'>" +
        (v ? "granted" : "denied") + "</td><td>" + state[t].source + "</td></tr>";
    });
    el.innerHTML = html + "</tbody></table>";
    return true;
  }

  function render() {
    var el = document.getElementById("readout");
    if (!el) return;

    if (window.__nksTestConfigMissing) {
      el.innerHTML = '<p><span class="pill pill-warn">Not configured</span> ' +
        'This page has no banner key yet. Fill in <code>config.js</code> before publishing.</p>';
      return;
    }

    var cmds = consentCommands();
    if (!cmds.length) {
      // No dataLayer commands is normal on the GTM route; show the real state.
      if (renderState(el)) return;
      el.innerHTML = '<p><span class="pill pill-warn">Waiting</span> No consent command has been observed yet.' +
        (window.__nksTestFetchError
          ? ' The banner configuration failed to load: <code>' + esc(window.__nksTestFetchError) + '</code>'
          : '') + '</p>';
      return;
    }

    var tagAt = firstGoogleTagIndex();
    var ordered = tagAt === -1 || cmds[0].index < tagAt;

    var html = '<p><span class="pill ' + (ordered ? "pill-ok" : "pill-warn") + '">' +
      (ordered ? "Default precedes the Google tag" : "Google tag ran first") + "</span></p>";

    html += "<table><thead><tr><th>#</th><th>command</th>";
    TYPES.forEach(function (t) { html += "<th>" + t.replace("_storage", "") + "</th>"; });
    html += "<th>region</th><th>wait</th></tr></thead><tbody>";

    cmds.forEach(function (c) {
      html += "<tr><td>" + c.index + "</td><td>" + esc(c.kind) + "</td>";
      TYPES.forEach(function (t) {
        var v = c.payload[t];
        html += "<td class='" + (v === "granted" ? "granted" : v === "denied" ? "denied" : "") + "'>" +
          (v === undefined ? "&middot;" : esc(v === "granted" ? "grant" : "deny")) + "</td>";
      });
      var region = c.payload.region ? [].concat(c.payload.region).join(" ") : "&middot;";
      html += "<td>" + region + "</td><td>" + (c.payload.wait_for_update || "&middot;") + "</td></tr>";
    });

    el.innerHTML = html + "</tbody></table>";
  }

  function wire(id, fn) {
    var b = document.getElementById(id);
    if (b) b.addEventListener("click", fn);
  }

  wire("refresh", render);

  wire("reopen", function () {
    var revoke = document.querySelector(".cc-revoke");
    if (revoke) { revoke.click(); return; }
    if (window.CookieConsent && typeof window.CookieConsent.showSettings === "function") {
      window.CookieConsent.showSettings();
      return;
    }
    alert("The preference control has not loaded yet. Wait a moment and try again.");
  });

  wire("reset", function () {
    var host = location.hostname;
    ["cookieconsent_status", "cconsent"].forEach(function (name) {
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + host;
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + host;
    });
    location.reload();
  });

  render();
  // The banner arrives after a network round trip and updates follow a click, so
  // poll briefly rather than asking the reviewer to press Refresh.
  var ticks = 0;
  var timer = setInterval(function () {
    render();
    if (++ticks > 40) clearInterval(timer);
  }, 1000);
})();
