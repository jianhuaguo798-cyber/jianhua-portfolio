/* 流体光晕背景 —— 手写 WebGL shader，噪声驱动的极光式流动 */
window.FXAurora = (function () {

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'uniform float uT;',
    'uniform vec2 uRes;',
    'uniform vec2 uMouse;',
    'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float n(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0; float a = 0.5;',
    '  for (int i = 0; i < 4; i++) { v += a * n(p); p *= 2.03; a *= 0.5; }',
    '  return v;',
    '}',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  vec2 p = uv; p.x *= uRes.x / uRes.y;',
    '  float t = uT * 0.05;',
    '  vec2 m = (uMouse - 0.5) * 0.35;',
    '  float n1 = fbm(p * 1.3 + t + m);',
    '  float n2 = fbm(p * 2.1 - t * 0.7 + n1);',
    '  float n3 = fbm(p * 0.8 + t * 0.5 - m);',
    '  vec3 col = vec3(0.020, 0.027, 0.051);',
    '  col += vec3(0.60, 0.48, 1.00) * 0.16 * smoothstep(0.35, 0.95, n1) * (1.0 - uv.y * 0.4);',
    '  col += vec3(0.49, 0.89, 1.00) * 0.14 * smoothstep(0.45, 0.95, n2) * (uv.x * 0.8 + 0.2);',
    '  col += vec3(1.00, 0.48, 0.78) * 0.09 * smoothstep(0.55, 0.95, n3 * n1 * 1.6);',
    '  float vig = smoothstep(1.25, 0.35, length(uv - 0.5));',
    '  col *= mix(0.55, 1.0, vig);',
    '  col += (h(gl_FragCoord.xy + uT) - 0.5) * 0.035;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function mount(canvas) {
    var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) {
      canvas.style.background =
        'radial-gradient(80% 70% at 25% 20%, rgba(90,70,190,.35), transparent 60%),' +
        'radial-gradient(70% 70% at 80% 70%, rgba(60,150,200,.28), transparent 60%), #05070d';
      return { setRunning: function () {} };
    }

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('shader error:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uT = gl.getUniformLocation(prog, 'uT');
    var uRes = gl.getUniformLocation(prog, 'uRes');
    var uMouse = gl.getUniformLocation(prog, 'uMouse');

    var SCALE = 0.5;
    function resize() {
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) { requestAnimationFrame(resize); return; }
      var w = Math.max(1, Math.floor(cw * SCALE));
      var hh = Math.max(1, Math.floor(ch * SCALE));
      if (canvas.width !== w || canvas.height !== hh) {
        canvas.width = w; canvas.height = hh;
        gl.viewport(0, 0, w, hh);
      }
    }
    resize();
    window.addEventListener('resize', resize);

    var mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX / window.innerWidth;
      ty = 1.0 - e.clientY / window.innerHeight;
    });

    var running = true, t0 = performance.now();
    function frame(now) {
      if (running) {
        mx += (tx - mx) * 0.04;
        my += (ty - my) * 0.04;
        gl.uniform1f(uT, (now - t0) / 1000);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mx, my);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      setRunning: function (v) { running = v; }
    };
  }

  return { mount: mount };
})();
