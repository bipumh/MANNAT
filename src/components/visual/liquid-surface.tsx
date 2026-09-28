"use client";

import { useEffect, useRef } from "react";

/**
 * A premium dark sea-water surface rendered with a lightweight WebGL fragment
 * shader (no external dependency): layered directional waves with a subtle
 * Fresnel + specular reflection, so it reads as a calm, dark sea with moving
 * reflected light rather than noise/smoke.
 *
 * The pointer disturbs the water with a bounded set of propagating ripples —
 * movement spawns localized distortions (strength from velocity), a click/tap
 * drops a slightly stronger wave, and each ripple expands, loses energy and
 * settles naturally. Respects `prefers-reduced-motion` and degrades to the page
 * background when WebGL is unavailable.
 */

const MAX_RIPPLES = 8;

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

#define RIPPLE_COUNT 8
#define RIPPLE_LIFE 2.5
#define RIPPLE_SPREAD_BASE 0.04
#define RIPPLE_SPREAD_RATE 0.13
#define RIPPLE_DECAY 1.8
#define RIPPLE_DISTORT 0.10
#define RIPPLE_NORMAL 0.05

uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uRipples[RIPPLE_COUNT];
uniform vec2 uRippleDirs[RIPPLE_COUNT];

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Layered directional sea waves — broad swells plus finer detail.
float waveHeight(vec2 p, float t) {
  float h = 0.0;
  h += 0.68 * sin(dot(vec2(0.62, 0.78), p) * 1.9 + t * 0.60);
  h += 0.48 * sin(dot(vec2(-0.82, 0.57), p) * 2.7 + t * 0.45 + 1.6);
  h += 0.30 * sin(dot(vec2(0.33, -0.94), p) * 4.0 + t * 0.36 + 3.4);
  h += 0.16 * sin(dot(vec2(0.92, 0.20), p) * 5.8 + t * 0.30 + 5.2);
  return h;
}

// Analytic gradient of the wave field (surface slope).
vec2 waveGrad(vec2 p, float t) {
  vec2 g = vec2(0.0);
  g += vec2(0.62, 0.78) * 1.9 * 0.68 * cos(dot(vec2(0.62, 0.78), p) * 1.9 + t * 0.60);
  g += vec2(-0.82, 0.57) * 2.7 * 0.48 * cos(dot(vec2(-0.82, 0.57), p) * 2.7 + t * 0.45 + 1.6);
  g += vec2(0.33, -0.94) * 4.0 * 0.30 * cos(dot(vec2(0.33, -0.94), p) * 4.0 + t * 0.36 + 3.4);
  g += vec2(0.92, 0.20) * 5.8 * 0.16 * cos(dot(vec2(0.92, 0.20), p) * 5.8 + t * 0.30 + 5.2);
  return g;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  vec2 q = vec2(uv.x * aspect, uv.y);

  float t = uTime * 0.7;

  // Cursor ripples — localized geometric disturbance of the water surface.
  vec2 rippleDisp = vec2(0.0);

  for (int i = 0; i < RIPPLE_COUNT; i++) {
    vec4 rp = uRipples[i];
    float amp = rp.w;
    if (amp <= 0.0001) continue;

    float age = uTime - rp.z;
    if (age < 0.0 || age > RIPPLE_LIFE) continue;

    vec2 off = q - rp.xy;
    float d = length(off);

    vec2 dir = uRippleDirs[i];
    float dAlong = dot(off, dir);
    float dPerp2 = max(d * d - dAlong * dAlong, 0.0);
    float dWarped = sqrt(dAlong * dAlong * 0.64 + dPerp2);

    float spread = RIPPLE_SPREAD_BASE + RIPPLE_SPREAD_RATE * age;
    float decay = exp(-age * RIPPLE_DECAY);
    float bump = exp(-(dWarped * dWarped) / (spread * spread));
    float hR = amp * decay * bump;

    vec2 radial = d > 0.0001 ? off / d : vec2(0.0);
    float grad = -2.0 * dWarped / (spread * spread) * hR;

    rippleDisp += radial * grad;
  }

  // Domain warp breaks the sine regularity so waves read as organic water.
  vec2 warp = vec2(
    noise(q * 1.7 + vec2(t * 0.07, t * 0.05)),
    noise(q * 1.7 - vec2(t * 0.05, t * 0.07))
  );
  vec2 p = q + (warp - 0.5) * 0.55;
  p += rippleDisp * RIPPLE_DISTORT;

  float h = waveHeight(p, t);
  vec2 g = waveGrad(p, t);

  vec3 N = normalize(vec3(-g * 0.5, 1.0));
  N = normalize(N + vec3(-rippleDisp * RIPPLE_NORMAL, 0.0));

  // Soft overhead light with Fresnel and broken reflective glints.
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(-0.35, 0.4, 0.85));
  vec3 H = normalize(L + V);
  float ndl = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 80.0);
  float fresnel = pow(1.0 - clamp(N.z, 0.0, 1.0), 3.0);

  float streak = noise(q * vec2(4.5, 42.0) + vec2(t * 0.2, 0.0));
  float glitter = smoothstep(0.4, 0.82, streak);

  vec3 deep = vec3(0.043, 0.059, 0.051);
  vec3 mid  = vec3(0.075, 0.100, 0.085);
  vec3 emerald = vec3(0.176, 0.831, 0.659);
  vec3 bright = vec3(0.431, 0.906, 0.718);

  // Dark base with gentle wave shading.
  vec3 col = deep;
  col = mix(col, mid, ndl * 0.34 + (h * 0.5 + 0.5) * 0.16);

  // Restrained emerald reflection that moves with the waves.
  col += emerald * (spec * (0.25 + 0.75 * glitter)) * 0.72;
  col += bright * spec * 0.26;
  col += emerald * fresnel * 0.26;

  // Depth: slightly darker toward the viewer (bottom) and softer edges.
  col *= 0.84 + 0.16 * uv.y;
  float d = length(uv - vec2(0.5, 0.5));
  col *= mix(1.0, 0.8, smoothstep(0.45, 0.95, d));

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Pointer interaction tuning (in aspect-corrected surface units).
const SPAWN_DISTANCE = 0.09; // travel between ripples while moving
const MAX_SPEED = 4.0; // surface units/sec considered "fast"
const BASE_AMP = 0.08; // ripple amplitude at slow movement
const MAX_AMP = 0.42; // ripple amplitude at fast movement
const CLICK_AMP = 0.5; // ripple amplitude on click/tap

export function LiquidSurface({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uRipples = gl.getUniformLocation(program, "uRipples");
    const uRippleDirs = gl.getUniformLocation(program, "uRippleDirs");

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let width = 1;
    let height = 1;
    let aspect = 1;

    const ripples = new Float32Array(MAX_RIPPLES * 4);
    const rippleDirs = new Float32Array(MAX_RIPPLES * 2);
    let rippleHead = 0;

    let prevX = 0;
    let prevY = 0;
    let prevT = 0;
    let hasPrev = false;
    let accX = 0;
    let accY = 0;
    let accDist = 0;
    let velocity = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = Math.floor(rect.width * dpr);
      height = Math.floor(rect.height * dpr);
      const maxDim = 1440;
      const longest = Math.max(width, height);
      if (longest > maxDim) {
        const scale = maxDim / longest;
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      aspect = width / height;
      gl.viewport(0, 0, width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const surfacePoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * aspect,
        y: (clientY - rect.top) / rect.height,
      };
    };

    const spawnRipple = (
      x: number,
      y: number,
      time: number,
      amp: number,
      dx: number,
      dy: number,
    ) => {
      const base = rippleHead * 4;
      ripples[base] = x;
      ripples[base + 1] = y;
      ripples[base + 2] = time;
      ripples[base + 3] = amp;
      const dirBase = rippleHead * 2;
      rippleDirs[dirBase] = dx;
      rippleDirs[dirBase + 1] = dy;
      rippleHead = (rippleHead + 1) % MAX_RIPPLES;
    };

    const onPointerMove = (event: PointerEvent) => {
      const pt = surfacePoint(event.clientX, event.clientY);
      if (!pt) return;
      const now = performance.now() / 1000;

      if (hasPrev) {
        const dx = pt.x - prevX;
        const dy = pt.y - prevY;
        const dist = Math.hypot(dx, dy);
        const dt = now - prevT;
        if (dist > 1e-6 && dt > 0.0005) {
          velocity += (dist / dt - velocity) * 0.5;
        }
        accX += dx;
        accY += dy;
        accDist += dist;

        if (accDist >= SPAWN_DISTANCE) {
          const adist = Math.hypot(accX, accY);
          const dirX = adist > 1e-6 ? accX / adist : 0;
          const dirY = adist > 1e-6 ? accY / adist : 0;
          const strength = Math.min(velocity / MAX_SPEED, 1);
          const amp = BASE_AMP + (MAX_AMP - BASE_AMP) * strength;
          spawnRipple(pt.x, pt.y, now, amp, dirX, dirY);
          accX = 0;
          accY = 0;
          accDist = 0;
        }
      }

      prevX = pt.x;
      prevY = pt.y;
      prevT = now;
      hasPrev = true;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const pt = surfacePoint(event.clientX, event.clientY);
      if (!pt) return;
      const now = performance.now() / 1000;
      spawnRipple(pt.x, pt.y, now, CLICK_AMP, 0, 0);
      prevX = pt.x;
      prevY = pt.y;
      prevT = now;
      hasPrev = true;
      accX = 0;
      accY = 0;
      accDist = 0;
      velocity = 0;
    };

    const draw = (time: number) => {
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uTime, reduced ? 4.0 : time / 1000);
      gl.uniform4fv(uRipples, ripples);
      gl.uniform2fv(uRippleDirs, rippleDirs);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let running = false;
    const loop = (time: number) => {
      draw(time);
      if (running) raf = requestAnimationFrame(loop);
    };
    const startLoop = () => {
      if (reduced || running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const visibilityObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      }
    });
    visibilityObserver.observe(canvas);

    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      startLoop();
    } else {
      draw(0);
    }

    return () => {
      stopLoop();
      observer.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
