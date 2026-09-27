/* Anonymous, consent-based portfolio analytics. Never blocks navigation or downloads. */
(function () {
  'use strict';
  var config = window.PORTFOLIO_ANALYTICS || {};
  var mode = new URLSearchParams(window.location.search).get('analytics');
  var debug = mode === 'debug';
  var consentKey = 'portfolio.analytics.consent.v1';
  var excludeKey = 'portfolio.analytics.exclude.v1';
  var storage = {
    get: function (key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set: function (key, value) { try { localStorage.setItem(key, value); } catch (_) {} },
    remove: function (key) { try { localStorage.removeItem(key); } catch (_) {} }
  };
  if (mode === 'off') storage.set(excludeKey, '1');
  if (mode === 'on') storage.remove(excludeKey);
  if (!debug && (!/^[a-z0-9]+$/i.test(config.projectId || '') || location.hostname !== config.hostname)) return;

  var excluded = storage.get(excludeKey) === '1';
  var privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  var enabled = false, loaded = false, timer = null;
  var lastTick = performance.now(), lastActivity = lastTick, activeMs = 0;
  var dwellMs = config.viewDwellMs || 2000, idleAfterMs = config.idleAfterMs || 45000;
  var sent = new Set();
  var targets = Array.from(document.querySelectorAll('[data-track-view]')).map(function (element) {
    return { element: element, name: element.dataset.trackView, visibleMs: 0 };
  });
  var panel = document.querySelector('#analytics-choice');
  var settings = document.querySelector('#analytics-settings');
  var detail = document.querySelector('#analytics-detail');
  if (settings) settings.hidden = false;

  function call() {
    if (debug) {
      console.info('[portfolio analytics preview]', Array.from(arguments));
    } else if (typeof window.clarity === 'function') {
      window.clarity.apply(window, arguments);
    }
  }
  function track(name, once) {
    if (!enabled || (once && sent.has(name))) return;
    if (once) sent.add(name);
    call('event', name);
  }
  function showChoice() {
    if (!panel) return;
    panel.hidden = false;
    var blocked = excluded || privacySignal;
    panel.querySelector('[data-analytics-choice="allow"]').disabled = blocked;
    if (detail) detail.textContent = excluded
      ? '此浏览器已排除访问统计。重新启用请使用 analytics=on 链接。'
      : privacySignal
        ? '已遵循浏览器的隐私偏好，本次访问不会参与统计。'
        : '使用 Microsoft Clarity 区分匿名访客并统计网页内的浏览、滚动、点击及下载按钮点击。不会获取你的真实姓名，也不会读取下载后的文件。';
  }
  function start() {
    if (enabled || excluded || privacySignal) return;
    enabled = true;
    if (!loaded) {
      loaded = true;
      if (!debug) {
        window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
        call('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.clarity.ms/tag/' + config.projectId;
        document.head.appendChild(script);
      }
      call('set', 'portfolio_version', config.portfolioVersion || 'unknown');
      track('portfolio_visit', true);
    } else if (!debug) {
      location.reload();
      return;
    }
    lastTick = performance.now();
    lastActivity = lastTick;
    timer = setInterval(tick, 500);
    if (panel) panel.hidden = true;
  }
  function stop() {
    enabled = false;
    if (timer !== null) clearInterval(timer);
    timer = null;
    targets.forEach(function (target) { target.visibleMs = 0; });
    if (loaded && !debug) {
      call('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      // Unload the SDK entirely; denied visits should send no further page data.
      location.reload();
    }
    if (panel) panel.hidden = true;
  }
  function isExposed(element) {
    var rect = element.getBoundingClientRect();
    var width = Math.min(rect.right, innerWidth) - Math.max(rect.left, 0);
    var height = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
    var visibleArea = Math.max(0, width) * Math.max(0, height);
    var availableArea = Math.min(rect.width, innerWidth) * Math.min(rect.height, innerHeight);
    return availableArea > 0 && visibleArea / availableArea >= 0.5;
  }
  function tick() {
    var now = performance.now();
    var elapsed = Math.min(now - lastTick, 1000);
    lastTick = now;
    if (!enabled) return;
    if (document.hidden || !document.hasFocus() || document.body.classList.contains('loading') || now - lastActivity > idleAfterMs) {
      targets.forEach(function (target) { target.visibleMs = 0; });
      return;
    }
    activeMs += elapsed;
    [30, 60, 120, 300].forEach(function (seconds) {
      if (activeMs >= seconds * 1000) track('active_' + seconds + 's', true);
    });
    targets.forEach(function (target) {
      if (sent.has('view_' + target.name)) return;
      target.visibleMs = isExposed(target.element) ? target.visibleMs + elapsed : 0;
      if (target.visibleMs >= dwellMs) {
        track('view_' + target.name, true);
        call('set', 'content_viewed', target.name);
      }
    });
  }
  function activity() { lastActivity = performance.now(); }
  ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'].forEach(function (event) {
    window.addEventListener(event, activity, { passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    lastTick = performance.now();
    if (!document.hidden) activity();
    targets.forEach(function (target) { target.visibleMs = 0; });
  });
  document.addEventListener('click', function (event) {
    if (!enabled || !(event.target instanceof Element)) return;
    var link = event.target.closest('a');
    if (!link) return;
    if (link.hasAttribute('data-track-download')) {
      call('set', 'download_file', link.dataset.trackDownload);
      call('set', 'download_entry', link.dataset.trackEntry || 'unknown');
      track('portfolio_download_click');
    } else if (link.hasAttribute('data-track-contact')) {
      track('contact_email_click');
    }
  }, true);
  if (settings) settings.addEventListener('click', showChoice);
  if (panel) panel.addEventListener('click', function (event) {
    if (!(event.target instanceof Element)) return;
    var button = event.target.closest('[data-analytics-choice]');
    if (!button || button.disabled) return;
    if (button.dataset.analyticsChoice === 'allow') {
      storage.set(consentKey, 'granted'); start();
    } else {
      storage.set(consentKey, 'denied'); stop();
    }
  });
  window.addEventListener('storage', function (event) {
    if (event.key !== consentKey && event.key !== excludeKey) return;
    excluded = storage.get(excludeKey) === '1';
    if (excluded || storage.get(consentKey) !== 'granted') stop();
  });
  window.addEventListener('pagehide', function () { if (timer !== null) clearInterval(timer); timer = null; });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && enabled) { lastTick = performance.now(); timer = setInterval(tick, 500); }
  });
  if (debug) start();
  else if (excluded || privacySignal) stop();
  else if (storage.get(consentKey) === 'granted') start();
  else if (storage.get(consentKey) !== 'denied') showChoice();
})();
