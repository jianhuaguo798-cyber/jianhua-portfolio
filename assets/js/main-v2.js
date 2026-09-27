/* 方案2 主逻辑 —— 加载序列 + Lenis + GSAP 编排 + 横幅 + 3D 卡片 + 光标 */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    if (reduced) { document.body.classList.add('reduced'); }

    /* ---------- 行内包裹（文字遮罩动画） ---------- */
    document.querySelectorAll('.line').forEach(function (line) {
      var inner = document.createElement('span');
      inner.className = 'line-inner';
      inner.style.display = 'inline-block';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
    });

    /* ---------- 标题拆字 ---------- */
    document.querySelectorAll('.split-title').forEach(function (el) {
      var chars = el.textContent.split('');
      el.textContent = '';
      chars.forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        el.appendChild(s);
      });
    });

    /* ---------- 特效挂载 ---------- */
    var aurora = null, fluid = null, fxp = null, waves = null;
    if (!reduced) {
      try {
        aurora = FXAurora.mount(document.getElementById('fx-aurora'));
        fluid = FXFluid.mount(document.getElementById('fx-fluid'));
        fxp = FXParticles.mount(document.getElementById('fx-particles'));
        waves = FXWaves.mount(document.getElementById('fx-waves'));
      } catch (err) {
        window.__FX_ERR = String(err && err.stack || err);
      }

      if (!window.__pump) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            var vis = en.isIntersecting;
            if (en.target.id === 'fx-aurora') {
              if (aurora) aurora.setRunning(vis);
              if (fluid) fluid.setRunning(vis);
              if (fxp) fxp.setRunning(vis);
            }
            if (en.target.id === 'fx-waves' && waves) waves.setRunning(vis);
          });
        }, { threshold: 0.02 });
        io.observe(document.getElementById('fx-aurora'));
        io.observe(document.getElementById('fx-waves'));
      }
    }

    /* ---------- 无动效降级 ---------- */
    if (reduced || !window.gsap) {
      document.body.classList.remove('loading');
      var ld = document.getElementById('loader');
      if (ld) ld.style.display = 'none';
      document.querySelectorAll('.stat-num').forEach(function (el) {
        el.textContent = el.dataset.count;
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* ---------- Lenis 平滑滚动 ---------- */
    var lenis = new Lenis({ lerp: 0.09 });
    if (window.__pump) { window.__lenis = lenis; }
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    var nav = document.getElementById('nav');
    lenis.on('scroll', function (e) {
      nav.classList.toggle('scrolled', e.scroll > 40);
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (target) {
          ev.preventDefault();
          lenis.scrollTo(target, { duration: 1.4, easing: function (t) { return 1 - Math.pow(1 - t, 3); } });
        }
      });
    });

    /* ---------- 加载序列 → 首屏入场 ---------- */
    var counter = { v: 0 };
    var loaderNum = document.getElementById('loader-num');
    var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

    intro
      .to('#loader-fill', { scaleX: 1, duration: 1.15, ease: 'power2.inOut' }, 0)
      .to(counter, {
        v: 100, duration: 1.15, ease: 'power2.inOut',
        onUpdate: function () { loaderNum.textContent = Math.round(counter.v); }
      }, 0)
      .to('.loader-inner', { y: -36, opacity: 0, duration: 0.5, ease: 'power2.in' }, 1.25)
      .to('#loader', {
        clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'power4.inOut',
        onComplete: function () {
          document.getElementById('loader').style.display = 'none';
          document.body.classList.remove('loading');
          lenis.start();
        }
      }, 1.5)
      .from('.nav', { y: -30, opacity: 0, duration: 1 }, 1.9)
      .from('.reveal-overline', { opacity: 0, letterSpacing: '0.7em', duration: 1.4 }, 2.0)
      .from('.hero-sub .line-inner', { yPercent: 120, duration: 1.1, stagger: 0.12 }, 2.2)
      .fromTo('.hero-cta .btn', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 2.55)
      .from('.hero-hint', { opacity: 0, duration: 1 }, 2.9)
      .from('.scroll-hint', { opacity: 0, duration: 1 }, 2.9);

    /* ---------- 滚动进度条 ---------- */
    gsap.to('#progress-fill', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });

    /* ---------- 首屏滚动离场 ---------- */
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: function (self) {
        if (fxp) {
          var d = self.progress * 1.35;
          fxp.setDisperse(d > 1 ? 1 : d);
        }
      }
    });
    gsap.to('.hero-top, .hero-bottom', {
      y: -80, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% top', scrub: true }
    });
    gsap.to('.scroll-hint, .hero-hint', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '25% top', scrub: true }
    });

    /* ---------- 无限横幅 + 滚动速度倾斜 ---------- */
    var track = document.getElementById('marquee-track');
    if (track) {
      track.innerHTML += track.innerHTML;
      gsap.to(track, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
      var skewTo = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power2.out' });
      lenis.on('scroll', function (e) {
        var v = Math.max(-9, Math.min(9, e.velocity * 0.28));
        skewTo(v);
      });
    }

    /* ---------- 标题拆字入场 ---------- */
    document.querySelectorAll('.split-title').forEach(function (el) {
      gsap.from(el.querySelectorAll('.char'), {
        yPercent: 115, duration: 0.85, ease: 'power3.out', stagger: 0.05,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    document.querySelectorAll('.section-head .sec-index, .section-head .sec-note').forEach(function (el) {
      gsap.from(el, {
        opacity: 0, y: 24, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
    document.querySelectorAll('.ghost-num').forEach(function (el) {
      gsap.from(el, {
        yPercent: 30, opacity: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%' }
      });
    });

    /* ---------- 作品卡片：浮现 + 3D 倾斜 + 聚光 ---------- */
    document.querySelectorAll('.work-card').forEach(function (card, i) {
      gsap.from(card, {
        y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', delay: (i % 2) * 0.12,
        scrollTrigger: { trigger: card, start: 'top 88%' }
      });

      if (finePointer) {
        gsap.set(card, { transformPerspective: 900 });
        var rxTo = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
        var ryTo = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
        var cover = card.querySelector('.work-cover');
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width;
          var ny = (e.clientY - r.top) / r.height;
          rxTo((0.5 - ny) * 10);
          ryTo((nx - 0.5) * 10);
          cover.style.setProperty('--mx', (nx * 100) + '%');
          cover.style.setProperty('--my', (ny * 100) + '%');
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
        });
      }
    });

    /* ---------- 关于我 ---------- */
    gsap.from('.about-statement .line-inner', {
      yPercent: 120, duration: 1.1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.about-statement', start: 'top 78%' }
    });
    gsap.from('.chip', {
      y: 20, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.04,
      scrollTrigger: { trigger: '.skills', start: 'top 85%' }
    });
    document.querySelectorAll('.stat-num').forEach(function (el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(obj.v); },
        scrollTrigger: { trigger: '.stats', start: 'top 85%' }
      });
    });

    /* ---------- 联系区 ---------- */
    gsap.from('.contact-title .line-inner', {
      yPercent: 120, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact', start: 'top 70%' }
    });
    gsap.from('.contact-sub, .btn-big, .socials', {
      y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.contact', start: 'top 62%' }
    });

    /* ---------- 磁性按钮 ---------- */
    if (finePointer) {
      document.querySelectorAll('.magnetic').forEach(function (el) {
        var inner = el.querySelector('.magnetic-inner') || el;
        var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
        var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
        var xiTo = gsap.quickTo(inner, 'x', { duration: 0.4, ease: 'power3.out' });
        var yiTo = gsap.quickTo(inner, 'y', { duration: 0.4, ease: 'power3.out' });
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          xTo(dx * 0.35); yTo(dy * 0.35);
          xiTo(dx * 0.15); yiTo(dy * 0.15);
        });
        el.addEventListener('mouseleave', function () {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
          gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
        });
      });
    }

    /* ---------- 自定义光标 ---------- */
    if (finePointer) {
      document.body.classList.add('has-cursor');
      var dot = document.querySelector('.cursor-dot');
      var ring = document.querySelector('.cursor-ring');
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
      var dxTo = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
      var dyTo = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
      var rxTo2 = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power2.out' });
      var ryTo2 = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power2.out' });
      var shown = false;
      window.addEventListener('pointermove', function (e) {
        if (!shown) { gsap.to([dot, ring], { opacity: 1, duration: 0.3 }); shown = true; }
        dxTo(e.clientX); dyTo(e.clientY);
        rxTo2(e.clientX); ryTo2(e.clientY);
      });
      window.addEventListener('pointerdown', function () {
        gsap.fromTo(ring, { scale: 0.72 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
      });
      document.querySelectorAll('[data-hover]').forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('is-on'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('is-on'); });
      });
    }
  });
})();
