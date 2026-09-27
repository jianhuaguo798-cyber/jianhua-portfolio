import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/js/analytics.js', import.meta.url), 'utf8');
function setup({ projectId = 'test123', consent, search = '', privacy = false, storageFails = false } = {}) {
  let now = 0, focused = true, loading = false, interval;
  const listeners = new Map(), log = [], scripts = [], state = new Map();
  if (consent) state.set('portfolio.analytics.consent.v1', consent);
  class Element {
    constructor(data = {}) { this.dataset = data; this.hidden = true; this.disabled = false; }
    addEventListener(name, fn) { listeners.set(this.id + ':' + name, fn); }
    closest(selector) { return selector === 'a' && this.isLink ? this : selector === '[data-analytics-choice]' && this.dataset.analyticsChoice ? this : null; }
    hasAttribute(name) { return name === 'data-track-download' && !!this.dataset.trackDownload || name === 'data-track-contact' && this.isContact; }
    getBoundingClientRect() { return this.rect || { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 }; }
  }
  const allow = new Element({ analyticsChoice: 'allow' });
  const panel = new Element(); panel.id = 'panel'; panel.querySelector = () => allow;
  const settings = new Element(); settings.id = 'settings';
  const detail = new Element();
  const content = new Element({ trackView: 'project_test' });
  const document = {
    hidden: false,
    hasFocus: () => focused,
    body: { classList: { contains: () => loading } },
    querySelectorAll: () => [content],
    querySelector: s => ({ '#analytics-choice': panel, '#analytics-settings': settings, '#analytics-detail': detail })[s],
    head: { appendChild: script => scripts.push(script) }, createElement: () => ({}),
    addEventListener: (name, fn) => listeners.set('document:' + name, fn)
  };
  const location = { search, hostname: 'portfolio.example', reload: () => log.push(['reload']) };
  const window = {
    PORTFOLIO_ANALYTICS: { projectId, hostname: location.hostname, viewDwellMs: 2000, idleAfterMs: 45000 },
    location, clarity: (...args) => log.push(args),
    addEventListener: (name, fn) => listeners.set('window:' + name, fn)
  };
  vm.runInNewContext(source, {
    window, document, location, navigator: { globalPrivacyControl: privacy }, Element, URLSearchParams, Set,
    localStorage: { getItem: k => { if (storageFails) throw Error('blocked'); return state.get(k); }, setItem: (k,v) => { if (storageFails) throw Error('blocked'); state.set(k,v); }, removeItem: k => state.delete(k) },
    performance: { now: () => now }, innerWidth: 1000, innerHeight: 800,
    setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { interval = null; },
    console: { info: (_label,args) => log.push(args) }
  });
  return { log, scripts, panel, settings, document, content, state,
    tick(n = 1) { for (let i=0;i<n;i++) { now += 500; interval?.(); } },
    focus(value) { focused = value; }, loading(value) { loading = value; },
    activity() { listeners.get('window:pointermove')?.(); },
    choose(value) { const el = new Element({ analyticsChoice: value }); listeners.get('panel:click')?.({ target: el }); },
    clickDownload() { const link = new Element({ trackDownload: 'portfolio_demo_v1', trackEntry: 'hero' }); link.isLink = true; listeners.get('document:click')?.({ target: link }); },
    count(event) { return log.filter(x => x[0] === 'event' && x[1] === event).length; }
  };
}

let s = setup({ projectId: '' });
assert.equal(s.scripts.length, 0); assert.equal(s.settings.hidden, true);
s = setup(); s.tick(10); s.clickDownload();
assert.equal(s.scripts.length, 0); assert.equal(s.log.length, 0); assert.equal(s.panel.hidden, false);
s.choose('deny'); assert.equal(s.scripts.length, 0);
s = setup({ privacy: true, consent: 'granted' }); s.tick(10);
assert.equal(s.scripts.length, 0); assert.equal(s.log.length, 0);
s = setup({ search: '?analytics=off', consent: 'granted' });
assert.equal(s.scripts.length, 0); assert.equal(s.state.get('portfolio.analytics.exclude.v1'), '1');
s = setup(); s.choose('allow');
assert.equal(s.scripts.length, 1); assert.equal(s.count('portfolio_visit'), 1);
assert.equal(s.log[0][1].ad_Storage, 'denied');
s.tick(3); assert.equal(s.count('view_project_test'), 0);
s.document.hidden = true; s.tick(4); s.document.hidden = false;
s.tick(3); assert.equal(s.count('view_project_test'), 0);
s.tick(); assert.equal(s.count('view_project_test'), 1);
s.tick(10); assert.equal(s.count('view_project_test'), 1);
s.clickDownload(); s.clickDownload(); assert.equal(s.count('portfolio_download_click'), 2);
s.choose('deny'); s.clickDownload(); assert.equal(s.count('portfolio_download_click'), 2);
assert.equal(s.log.at(-1)[0], 'reload');
s = setup({ search: '?analytics=debug' }); s.tick(10);
assert.equal(s.scripts.length, 0); assert.equal(s.count('view_project_test'), 1);
s = setup({ consent: 'granted' }); s.loading(true); s.tick(10); s.loading(false); s.focus(false); s.tick(10);
assert.equal(s.count('view_project_test'), 0);
s.focus(true); s.tick(60); assert.equal(s.count('active_30s'), 1);
s.tick(200); assert.equal(s.count('active_60s'), 0, 'idle time must not count toward active time');
s.activity(); s.tick(60); assert.equal(s.count('active_60s'), 1);
s = setup({ storageFails: true }); s.choose('allow');
assert.equal(s.scripts.length, 1, 'storage failures must not break the page');
console.log('PASS: inert configuration, consent, privacy signal, self-exclusion, dwell deduplication, visibility/focus, idle time, download intent, revocation and debug isolation.');
