/**
 * PromoApp Widget Loader
 * Cross-origin embed runtime for INLINE / POPUP / BANNER / SLIDE_IN.
 * Application origin is derived from this script's src or data-origin — never the host page origin.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if ((scripts[i].src || '').indexOf('widget.js') !== -1) {
        script = scripts[i];
        break;
      }
    }
  }

  function attr(name, fallback) {
    if (script && script.getAttribute(name)) return script.getAttribute(name);
    return fallback;
  }

  function resolveAppOrigin() {
    var dataOrigin = (attr('data-origin', '') || '').trim().replace(/\/$/, '');
    if (dataOrigin && /^https?:\/\//i.test(dataOrigin)) {
      try {
        return new URL(dataOrigin).origin;
      } catch (e) { /* ignore */ }
    }
    var src = script && script.src;
    if (src) {
      try {
        var url = new URL(src, document.baseURI);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return url.origin;
        }
      } catch (e) { /* ignore */ }
    }
    return '';
  }

  var appOrigin = resolveAppOrigin();
  var campaign = attr('data-campaign', (window.PromoAppWidget && window.PromoAppWidget.campaign) || '');
  var mode = (attr('data-mode', (window.PromoAppWidget && window.PromoAppWidget.type) || 'inline') || 'inline').toLowerCase();
  if (mode === 'slide_in') mode = 'slide-in';

  if (!campaign) {
    console.error('PromoApp: data-campaign is required');
    return;
  }
  if (!appOrigin) {
    console.error('PromoApp: could not resolve application origin. Set data-origin or load widget.js from the PromoApp host.');
    return;
  }

  var defaults = {
    trigger: attr('data-trigger', 'delay') || 'delay',
    delay: parseInt(attr('data-delay', '5'), 10) || 5,
    scroll: parseInt(attr('data-scroll', '50'), 10) || 50,
    position: attr('data-position', mode === 'banner' ? 'bottom' : 'right') || 'right',
    frequencyHours: parseInt(attr('data-frequency', '24'), 10),
    showOnMobile: attr('data-mobile', 'true') !== 'false',
    title: '',
    active: true,
    widgetUrl: appOrigin + '/widget/' + encodeURIComponent(campaign),
  };
  if (!Number.isFinite(defaults.frequencyHours)) defaults.frequencyHours = 24;

  var Z = 2147483000;
  var host = (location.hostname || 'unknown').toLowerCase();
  var storageKey = 'promoapp:dismiss:' + campaign + ':' + host + ':' + mode;
  var instances = { overlay: null, banner: null, drawer: null, iframe: null };

  function isMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function readDismissedAt() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      var n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : null;
    } catch (e) {
      return null;
    }
  }

  function markDismissed() {
    try {
      localStorage.setItem(storageKey, String(Date.now()));
    } catch (e) { /* ignore */ }
  }

  function shouldShow() {
    if (!defaults.showOnMobile && isMobile()) return false;
    var dismissedAt = readDismissedAt();
    if (!dismissedAt) return true;
    if (defaults.frequencyHours <= 0) return false;
    return Date.now() - dismissedAt >= defaults.frequencyHours * 60 * 60 * 1000;
  }

  function bindResize(iframe) {
    window.addEventListener('message', function (event) {
      if (event.origin !== appOrigin) return;
      var data = event.data;
      if (!data || data.source !== 'promoapp' || data.type !== 'promoapp-resize') return;
      if (typeof data.height !== 'number') return;
      var height = Math.max(320, Math.min(Math.round(data.height), 2400));
      iframe.style.height = height + 'px';
    });
  }

  function createCampaignIframe(extraStyle) {
    var iframe = document.createElement('iframe');
    iframe.src = defaults.widgetUrl;
    iframe.title = defaults.title || 'Giveaway';
    iframe.setAttribute('loading', 'lazy');
    iframe.style.cssText = 'border:0;width:100%;height:560px;background:transparent;display:block;' + (extraStyle || '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    bindResize(iframe);
    return iframe;
  }

  function closeAll() {
    if (instances.overlay) instances.overlay.style.display = 'none';
    if (instances.drawer) instances.drawer.style.display = 'none';
    document.documentElement.style.overflow = '';
    window.dispatchEvent(new CustomEvent('promoapp-close', { detail: { campaign: campaign, mode: mode } }));
  }

  function dismissAll() {
    markDismissed();
    closeAll();
    if (instances.banner) instances.banner.style.display = 'none';
  }

  function openDialog() {
    ensureOverlay();
    instances.overlay.style.display = 'flex';
    instances.overlay.setAttribute('aria-hidden', 'false');
    var closeBtn = instances.overlay.querySelector('[data-promoapp-close]');
    if (closeBtn) closeBtn.focus();
  }

  function ensureOverlay() {
    if (instances.overlay) return instances.overlay;
    var overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', defaults.title || 'Giveaway');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(9,9,11,0.72);z-index:' + Z + ';display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';

    var panel = document.createElement('div');
    panel.style.cssText = 'position:relative;width:min(500px,100%);max-height:90vh;overflow:auto;border-radius:16px;background:#09090b;box-shadow:0 20px 50px rgba(0,0,0,0.45);';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('data-promoapp-close', '1');
    closeBtn.setAttribute('aria-label', 'Close giveaway');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:8px;right:10px;z-index:2;background:transparent;border:0;color:#fff;font-size:28px;line-height:1;cursor:pointer;';
    closeBtn.onclick = function () { dismissAll(); };

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismissAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.style.display === 'flex') dismissAll();
    });

    var iframe = createCampaignIframe();
    panel.appendChild(closeBtn);
    panel.appendChild(iframe);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    instances.overlay = overlay;
    instances.iframe = iframe;
    return overlay;
  }

  function createInline() {
    var containerId = 'promoapp-widget-' + campaign;
    var container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      if (script && script.parentNode) {
        script.parentNode.insertBefore(container, script);
      } else {
        document.body.appendChild(container);
      }
    }
    container.style.cssText = 'width:100%;max-width:520px;';
    var iframe = createCampaignIframe('max-width:520px;border-radius:12px;');
    container.appendChild(iframe);
  }

  function createBanner() {
    var banner = document.createElement('div');
    var edge = defaults.position === 'top' ? 'top' : 'bottom';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', defaults.title || 'Giveaway banner');
    banner.style.cssText = 'position:fixed;left:0;right:0;' + edge + ':0;z-index:' + (Z - 1) + ';background:#18181b;color:#fff;padding:12px 16px;box-shadow:0 0 24px rgba(0,0,0,0.25);font-family:system-ui,sans-serif;';
    if (edge === 'top') banner.style.paddingTop = 'max(12px, env(safe-area-inset-top))';
    if (edge === 'bottom') banner.style.paddingBottom = 'max(12px, env(safe-area-inset-bottom))';

    var row = document.createElement('div');
    row.style.cssText = 'max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;';

    var text = document.createElement('div');
    text.style.cssText = 'font-size:14px;';
    text.textContent = defaults.title ? defaults.title : 'Enter our giveaway';

    var cta = document.createElement('button');
    cta.type = 'button';
    cta.textContent = 'Enter now';
    cta.style.cssText = 'background:#6366f1;color:#fff;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600;';
    cta.onclick = function () { openDialog(); };

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss banner');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'background:transparent;border:0;color:#a1a1aa;font-size:22px;cursor:pointer;';
    closeBtn.onclick = function () { dismissAll(); };

    row.appendChild(text);
    row.appendChild(cta);
    row.appendChild(closeBtn);
    banner.appendChild(row);
    document.body.appendChild(banner);
    instances.banner = banner;
  }

  function createSlideIn() {
    var drawer = document.createElement('div');
    var side = defaults.position === 'left' ? 'left' : 'right';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', defaults.title || 'Giveaway');
    drawer.style.cssText = 'position:fixed;top:auto;bottom:16px;' + side + ':16px;z-index:' + Z + ';width:min(380px,calc(100vw - 24px));max-height:min(640px,80vh);overflow:auto;border-radius:16px;background:#09090b;box-shadow:0 18px 40px rgba(0,0,0,0.4);display:none;';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:8px;right:10px;z-index:2;background:transparent;border:0;color:#fff;font-size:28px;cursor:pointer;';
    closeBtn.onclick = function () { dismissAll(); };

    var iframe = createCampaignIframe('border-radius:16px;');
    drawer.appendChild(closeBtn);
    drawer.appendChild(iframe);
    document.body.appendChild(drawer);
    instances.drawer = drawer;
  }

  function openSlideIn() {
    if (!instances.drawer) createSlideIn();
    instances.drawer.style.display = 'block';
  }

  function attachTriggers(openFn) {
    var trigger = defaults.trigger || 'delay';
    if (trigger === 'click') {
      window.PromoApp = window.PromoApp || {};
      return;
    }
    if (trigger === 'immediate') {
      openFn();
      return;
    }
    if (trigger === 'delay') {
      setTimeout(openFn, Math.max(0, defaults.delay) * 1000);
      return;
    }
    if (trigger === 'scroll') {
      var fired = false;
      function onScroll() {
        if (fired) return;
        var doc = document.documentElement;
        var total = doc.scrollHeight - window.innerHeight;
        var pct = total <= 0 ? 100 : (window.scrollY / total) * 100;
        if (pct >= defaults.scroll) {
          fired = true;
          window.removeEventListener('scroll', onScroll);
          openFn();
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return;
    }
    if (trigger === 'exit_intent') {
      function onOut(e) {
        if (isMobile()) return;
        if (e.clientY > 12) return;
        document.removeEventListener('mouseout', onOut);
        openFn();
      }
      document.addEventListener('mouseout', onOut);
    }
  }

  function boot(settings) {
    if (settings) {
      defaults.trigger = settings.popupTrigger || defaults.trigger;
      defaults.delay = settings.popupDelay || defaults.delay;
      defaults.scroll = settings.popupScrollPercent || defaults.scroll;
      defaults.position = (mode === 'banner' ? settings.bannerPosition : settings.slideInPosition) || defaults.position;
      defaults.frequencyHours = settings.embedFrequencyHours ?? defaults.frequencyHours;
      defaults.showOnMobile = settings.showOnMobile !== false;
      defaults.title = settings.title || defaults.title;
      defaults.active = settings.active !== false;
      if (settings.widgetUrl) defaults.widgetUrl = settings.widgetUrl;
    }

    window.PromoApp = {
      open: function () {
        if (mode === 'slide-in') openSlideIn();
        else openDialog();
      },
      close: function () { closeAll(); },
      campaign: campaign,
      mode: mode,
      origin: appOrigin,
    };

    if (!defaults.active && mode !== 'inline') {
      return;
    }
    if (mode !== 'inline' && !shouldShow()) {
      return;
    }

    if (mode === 'popup') {
      attachTriggers(openDialog);
    } else if (mode === 'banner') {
      createBanner();
    } else if (mode === 'slide-in') {
      attachTriggers(openSlideIn);
    } else {
      if (!defaults.showOnMobile && isMobile()) return;
      createInline();
    }
  }

  function fetchConfig(done) {
    var url = appOrigin + '/api/public/c/' + encodeURIComponent(campaign) + '/embed-config';
    try {
      fetch(url, { credentials: 'omit', mode: 'cors' })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (json) { done(json && json.data ? json.data : null); })
        .catch(function () { done(null); });
    } catch (e) {
      done(null);
    }
  }

  function start() {
    fetchConfig(boot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
