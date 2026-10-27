import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx, useInView, useReducedMotion } from "./hooks";
import styles from "./LiquidMetalLink.module.css";

export interface LiquidMetalLinkProps {
  /** Route the button goes to. */
  to: string;
  children: ReactNode;
  /** "cream" sits on forest (the hero); "forest" sits on cream. */
  tone?: "cream" | "forest";
  className?: string;
}

/**
 * The primary call to action, with a liquid-metal edge in brass (adapted from the liquid-metal
 * button reference). A small WebGL shader runs a slow brass flow around the edge and speeds up
 * on hover or keyboard focus. With reduced motion, off screen, or if WebGL is unavailable, the
 * edge is a static brass gradient and the button works exactly the same.
 */
export function LiquidMetalLink({ to, children, tone = "cream", className }: LiquidMetalLinkProps) {
  const reduced = useReducedMotion();
  const [viewRef, inView] = useInView<HTMLSpanElement>({ rootMargin: "0px" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const speedRef = useRef(0.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (reduced || !inView || !canvas) {
      setLive(false);
      return;
    }
    const metal = startMetal(canvas, speedRef);
    setLive(Boolean(metal));
    return () => metal?.stop();
  }, [reduced, inView]);

  const fast = () => (speedRef.current = 1.4);
  const slow = () => (speedRef.current = 0.5);

  return (
    <span ref={viewRef} className={cx(styles.wrap, className)}>
      <Link
        to={to}
        className={cx(styles.button, styles[tone], live && styles.live)}
        onMouseEnter={fast}
        onMouseLeave={slow}
        onFocus={fast}
        onBlur={slow}
      >
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <span className={styles.face}>{children}</span>
      </Link>
    </span>
  );
}

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// Flowing metallic bands in the brand's brass: dark brass, brass, pale brass highlight, cream glint.
const FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_aspect;
void main() {
  vec2 p = (v_uv - 0.5) * vec2(u_aspect, 1.0);
  float a = atan(p.y, p.x);
  float flow = sin(v_uv.x * 7.0 - u_time * 1.3 + sin(v_uv.y * 9.0 + u_time) * 1.1)
             + 0.6 * sin((v_uv.x + v_uv.y) * 11.0 + u_time * 1.7)
             + 0.4 * sin(a * 3.0 - u_time * 0.8);
  float v = 0.5 + 0.5 * sin(flow * 1.7);
  vec3 dark = vec3(0.431, 0.318, 0.098);
  vec3 brass = vec3(0.788, 0.643, 0.361);
  vec3 pale = vec3(0.965, 0.894, 0.690);
  vec3 cream = vec3(0.984, 0.957, 0.890);
  vec3 col = mix(dark, brass, smoothstep(0.0, 0.5, v));
  col = mix(col, pale, smoothstep(0.62, 0.86, v));
  col = mix(col, cream, smoothstep(0.92, 1.0, v));
  gl_FragColor = vec4(col, 1.0);
}`;

/** Starts the shader on the canvas; returns null when WebGL or the shader is unavailable. */
function startMetal(canvas: HTMLCanvasElement, speed: { current: number }): { stop: () => void } | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl!.createShader(type);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    return gl!.getShaderParameter(shader, gl!.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uTime = gl.getUniformLocation(program, "u_time");
  const uAspect = gl.getUniformLocation(program, "u_aspect");

  let frame = 0;
  let stopped = false;
  let t = 0;
  let last = performance.now();
  const draw = (now: number) => {
    if (stopped || !gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    t += ((now - last) / 1000) * speed.current;
    last = now;
    gl.uniform1f(uTime, t);
    gl.uniform1f(uAspect, w / h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frame = requestAnimationFrame(draw);
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    stopped = true;
    cancelAnimationFrame(frame);
    canvas.dataset.lost = "true";
  };
  canvas.addEventListener("webglcontextlost", onLost);
  frame = requestAnimationFrame(draw);

  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", onLost);
    },
  };
}
