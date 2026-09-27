/* 波场线条 —— 页尾联系区的流动波纹背景 */
window.FXWaves = (function () {

  function mount(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var running = true;

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) { requestAnimationFrame(resize); return; }
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var mouse = { x: -9e3, y: -9e3 };
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });

    var t = 0, last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!running) return;
      if (!last) last = now;
      t += Math.min(Math.max((now - last) / 1000, 0), 0.12);
      last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.1;

      var N = 16;
      for (var i = 0; i < N; i++) {
        var by = H * (0.18 + 0.66 * i / (N - 1));
        var hue = 195 + i * 5.5;
        ctx.strokeStyle = 'hsla(' + hue + ', 80%, 64%, 0.20)';
        ctx.beginPath();
        for (var x = 0; x <= W; x += 8) {
          var dm = Math.hypot(x - mouse.x, by - mouse.y);
          var boost = Math.max(0, 1 - dm / 220) * 30;
          var y = by
            + Math.sin(x * 0.006 + t * 1.1 + i * 0.42) * (10 + boost)
            + Math.sin(x * 0.0023 - t * 0.5 + i * 0.8) * 8;
          if (x === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
      }
    }
    requestAnimationFrame(frame);

    return {
      setRunning: function (v) { running = v; }
    };
  }

  return { mount: mount };
})();
