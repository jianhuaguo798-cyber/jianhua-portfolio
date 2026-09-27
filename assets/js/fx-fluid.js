/* 流体光烟拖尾 —— 鼠标划过时喷出彩色光烟，随卷曲噪声漂散 */
window.FXFluid = (function () {

  function mount(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var running = true;
    var blobs = [];
    var MAX = 150;

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) { requestAnimationFrame(resize); return; }
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var px = -1, py = -1;
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > W || y > H) { px = -1; return; }
      if (px < 0) { px = x; py = y; return; }
      var dx = x - px, dy = y - py;
      var dist = Math.hypot(dx, dy);
      if (dist < 5) return;
      var steps = Math.min(3, Math.ceil(dist / 24));
      for (var i = 0; i < steps; i++) {
        var f = (i + 1) / steps;
        emit(px + dx * f, py + dy * f, dx * 0.06, dy * 0.06);
      }
      px = x; py = y;
    });

    var hueT = 0;
    function emit(x, y, vx, vy) {
      if (blobs.length >= MAX) blobs.shift();
      hueT += 0.018;
      var hue = 190 + (Math.sin(hueT) * 0.5 + 0.5) * 130;
      blobs.push({
        x: x, y: y,
        vx: vx + (Math.random() - 0.5) * 0.8,
        vy: vy + (Math.random() - 0.5) * 0.8,
        r: 26 + Math.random() * 22,
        grow: 34 + Math.random() * 26,
        life: 1,
        decay: 0.5 + Math.random() * 0.25,
        hue: hue
      });
    }

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
      if (!blobs.length) return;

      ctx.globalCompositeOperation = 'lighter';
      for (var i = blobs.length - 1; i >= 0; i--) {
        var b = blobs[i];
        b.life -= b.decay * dt;
        if (b.life <= 0.02) { blobs.splice(i, 1); continue; }

        var cx2 = Math.sin(b.y * 0.011 + t * 0.9) * 0.55;
        var cy2 = Math.cos(b.x * 0.009 - t * 0.7) * 0.55;
        b.vx = (b.vx + cx2 * 0.12 * f60) * Math.pow(0.965, f60);
        b.vy = (b.vy + (cy2 - 0.18) * 0.12 * f60) * Math.pow(0.965, f60);
        b.x += b.vx * f60;
        b.y += b.vy * f60;
        b.r += b.grow * dt;

        var a = b.life * b.life * 0.13;
        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, 'hsla(' + b.hue + ', 90%, 66%, ' + a + ')');
        g.addColorStop(0.55, 'hsla(' + (b.hue + 24) + ', 85%, 58%, ' + (a * 0.45) + ')');
        g.addColorStop(1, 'hsla(' + (b.hue + 40) + ', 80%, 50%, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, 7);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    requestAnimationFrame(frame);

    return {
      setRunning: function (v) { running = v; }
    };
  }

  return { mount: mount };
})();
