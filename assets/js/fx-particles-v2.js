/* 粒子聚字 v2 —— 辉光渲染 + 流光扫过 + 点击爆散重组 + 鼠标斥力 + 滚动散场 */
window.FXParticles = (function () {

  function mount(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
    var disperse = 0;
    var running = true;
    var text = canvas.dataset.text || '作品集';

    var mouse = { x: -9e3, y: -9e3 };
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    window.addEventListener('pointerleave', function () { mouse.x = -9e3; mouse.y = -9e3; });

    window.addEventListener('pointerdown', function (e) {
      if (disperse > 0.4) return;
      var r = canvas.getBoundingClientRect();
      var bx = e.clientX - r.left, by = e.clientY - r.top;
      if (bx < 0 || by < 0 || bx > W || by > H) return;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dx = p.x - bx, dy = p.y - by;
        var d = Math.hypot(dx, dy) + 24;
        var mag = Math.min(1300 / d, 16);
        p.vx += (dx / d) * mag;
        p.vy += (dy / d) * mag;
      }
    });

    function buildTargets() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) { requestAnimationFrame(buildTargets); return; }
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var off = document.createElement('canvas');
      off.width = W; off.height = H;
      var oc = off.getContext('2d', { willReadFrequently: true });

      var fontStack = '"PingFang SC", "SF Pro Display", "Noto Sans SC", "Microsoft YaHei", sans-serif';
      oc.font = '800 100px ' + fontStack;
      var w100 = oc.measureText(text).width || 100;
      var fs = Math.min((W * 0.84) / w100 * 100, H * 0.42);
      oc.font = '800 ' + fs + 'px ' + fontStack;
      oc.textAlign = 'center';
      oc.textBaseline = 'middle';
      oc.fillStyle = '#fff';
      oc.fillText(text, W / 2, H * 0.40);

      var data = oc.getImageData(0, 0, W, H).data;
      var step = Math.max(3, Math.round(fs / 46));
      var targets = [];
      for (var y = 0; y < H; y += step) {
        for (var x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 128) {
            targets.push({ x: x, y: y });
          }
        }
      }

      var old = particles;
      particles = [];
      for (var i = 0; i < targets.length; i++) {
        var tg = targets[i];
        var p = old[i] || {
          x: Math.random() * W,
          y: Math.random() * H
        };
        particles.push({
          x: p.x, y: p.y,
          vx: 0, vy: 0,
          tx: tg.x + (Math.random() - 0.5) * 1.5,
          ty: tg.y + (Math.random() - 0.5) * 1.5,
          k: 0.045 + Math.random() * 0.035,
          sz: 0.7 + Math.random() * 1.1,
          tw: Math.random() * 6.28,
          col: Math.random() < 0.72 ? '216,236,255' : (Math.random() < 0.6 ? '125,227,255' : '175,140,255'),
          ox: (Math.random() - 0.5) * 2,
          oy: (Math.random() - 0.5) * 2
        });
      }
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildTargets, 200);
    });
    buildTargets();

    var t = 0, last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!running) return;
      if (!last) last = now;
      var dt = Math.min(Math.max((now - last) / 1000, 0), 0.12);
      last = now;
      var f60 = dt * 60;
      t += dt;
      ctx.clearRect(0, 0, W, H);

      var cx = W / 2, cy = H * 0.40;
      var globalA = 1 - disperse * 0.92;
      var i, p;

      for (i = 0; i < particles.length; i++) {
        p = particles[i];

        var k = 1 - Math.pow(1 - p.k * (1 - disperse), f60);
        p.x += (p.tx - p.x) * k;
        p.y += (p.ty - p.y) * k;

        p.x += p.vx * f60;
        p.y += p.vy * f60;
        var damp = Math.pow(0.88, f60);
        p.vx *= damp;
        p.vy *= damp;

        if (disperse > 0.01) {
          p.x += ((p.x - cx) * 0.013 * disperse + p.ox * disperse * 2.2) * f60;
          p.y += ((p.y - cy) * 0.013 * disperse + p.oy * disperse * 2.2) * f60;
        }

        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d = Math.hypot(dx, dy);
        if (d < 120 && d > 0.5) {
          var f = (1 - d / 120) * 9 * f60;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var shimmer = 0.72 + 0.38 * Math.sin(t * 1.8 - (p.tx + p.ty * 0.3) * 0.006);
        var aBase = ((0.5 + 0.5 * Math.sin(t * 2.2 + p.tw)) * 0.55 + 0.4) * shimmer * globalA;
        ctx.fillStyle = 'rgba(' + p.col + ',' + (aBase * 0.1) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz * 3.4, 0, 7);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var shimmer2 = 0.72 + 0.38 * Math.sin(t * 1.8 - (p.tx + p.ty * 0.3) * 0.006);
        var a = ((0.5 + 0.5 * Math.sin(t * 2.2 + p.tw)) * 0.55 + 0.4) * shimmer2 * globalA;
        ctx.fillStyle = 'rgba(' + p.col + ',' + a + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, 7);
        ctx.fill();
      }
    }
    requestAnimationFrame(frame);

    return {
      setDisperse: function (v) { disperse = v < 0 ? 0 : v > 1 ? 1 : v; },
      setRunning: function (v) { running = v; },
      rebuild: buildTargets
    };
  }

  return { mount: mount };
})();
