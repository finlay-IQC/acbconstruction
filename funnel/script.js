// ACB Construction funnel — lightweight helpers
// UTM capture + carry-through, smooth scroll to form, sticky CTA, FAQ accordion.
(function () {
  'use strict';

  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
              'fbclid', 'gclid', 'ttclid', 'msclkid'];
  var STORE = 'acb_utm';

  // ---------- UTM capture ----------
  function readStored() {
    try { return JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function saveStored(obj) {
    try { sessionStorage.setItem(STORE, JSON.stringify(obj)); } catch (e) { /* storage blocked */ }
  }

  var params = new URLSearchParams(window.location.search);
  var utm = readStored();
  var found = false;
  KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) { utm[k] = v; found = true; }
  });
  if (found) saveStored(utm);

  function withUtm(url) {
    var keys = Object.keys(utm);
    if (!keys.length) return url;
    try {
      var u = new URL(url, window.location.href);
      keys.forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, utm[k]); });
      return u.toString();
    } catch (e) { return url; }
  }

  // Append UTMs to any internal link pointing at thank-you.html
  document.querySelectorAll('a[href*="thank-you.html"]').forEach(function (a) {
    a.href = withUtm(a.getAttribute('href'));
  });

  // Pass UTMs to the form embed iframe (most tools map query params to hidden fields).
  // Runs once the real embed is pasted into #form-embed.
  function tagIframe() {
    var frame = document.querySelector('#form-embed iframe');
    if (!frame || frame.dataset.utmTagged) return;
    var src = frame.getAttribute('src');
    if (src) { frame.setAttribute('src', withUtm(src)); frame.dataset.utmTagged = '1'; }
  }
  tagIframe();

  // Fill hidden inputs inside a native (non-iframe) form if one is used.
  document.querySelectorAll('#form-embed input[type="hidden"]').forEach(function (input) {
    if (utm[input.name] && !input.value) input.value = utm[input.name];
  });

  // Redirect helper — call window.acbThankYou() from a form "on submit" hook if needed.
  window.acbThankYou = function () {
    window.location.href = withUtm('thank-you.html');
  };

  // ---------- Smooth scroll to form ----------
  var formSection = document.getElementById('form');
  document.querySelectorAll('[data-scroll-form]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!formSection) return;
      e.preventDefault();
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#form');
    });
  });

  // ---------- Sticky CTA ----------
  var sticky = document.querySelector('[data-sticky-cta]');
  var hero = document.querySelector('.hero');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var pastHero = false;
    var formVisible = false;
    var update = function () {
      var show = pastHero && !formVisible;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      sticky.querySelectorAll('a').forEach(function (a) { a.tabIndex = show ? 0 : -1; });
      document.body.classList.toggle('has-sticky', show);
    };
    new IntersectionObserver(function (entries) {
      pastHero = !entries[0].isIntersecting;
      update();
    }, { threshold: 0 }).observe(hero);
    if (formSection) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.15 }).observe(formSection);
    }
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll('[data-faq] .faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (panel) panel.hidden = open;
    });
  });

  // ---------- Footer year ----------
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
