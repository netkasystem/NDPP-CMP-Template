/*
 * EN/TH switch for the review pages.
 *
 * Both languages are in the markup ([data-l="en"] / [data-l="th"]) and the CSS
 * hides the one not chosen, so the pages read in full without JavaScript —
 * in English, which is what the reviewers get by default. Loaded in <head> so
 * the chosen language is set before first paint. It only touches the page's
 * own text; the consent banner keeps its own language setting.
 */
(function () {
  "use strict";

  var KEY = "nks-cmp-lang";
  var root = document.documentElement;

  function initial() {
    var q = /[?&]lang=(en|th)(?:&|$)/.exec(location.search);
    if (q) return q[1];
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "en" || saved === "th") return saved;
    } catch (e) { /* storage blocked: fall back to English */ }
    return "en";
  }

  var titleEn = null;

  function apply(lang) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    var t = document.querySelector("title");
    if (t) {
      if (titleEn === null) titleEn = t.textContent;
      var th = t.getAttribute("data-th");
      document.title = lang === "th" && th ? th : titleEn;
    }
    var buttons = document.querySelectorAll(".lang button[data-set-lang]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-set-lang") === lang));
    }
  }

  function set(lang) {
    apply(lang);
    try { localStorage.setItem(KEY, lang); } catch (e) { /* not remembered, still switched */ }
    document.dispatchEvent(new CustomEvent("nks:lang", { detail: lang }));
  }

  window.nksLang = function () { return root.getAttribute("data-lang") === "th" ? "th" : "en"; };

  apply(initial());

  document.addEventListener("DOMContentLoaded", function () {
    apply(window.nksLang());
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-set-lang]");
      if (b) set(b.getAttribute("data-set-lang"));
    });
  });
})();
