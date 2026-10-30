/**
 * Liquid glass navbar, adapted for Mobility from Nimbus UI "Waterline" by guglielmogiannattasio.it.
 *
 * A glass pill; the active item sits in a drop of water that stretches toward the item you pick,
 * splits into droplets on long jumps and merges back with a ripple. The water is a small WebGL
 * shader drawn only inside the pill and paused off-screen; without WebGL it falls back to a CSS drop.
 *
 * Changes from the original for this app:
 * - Mobility colours (Forest, Cream, Brass) in the glass, the water and the shader.
 * - Router links (react-router <Link>) instead of plain anchors, active item passed in.
 * - 18px labels that never hide, 56px items (64px stacked), 3px Forest focus ring with Cream offset.
 * - "stacked" layout (icon over label) for the phone bottom bar; no icon-only mode.
 * - Arrow keys move focus between items; Enter follows the link. No sound.
 * - Brand fonts from the page instead of the system stack.
 */
import * as React from "react";
import { Link } from "react-router-dom";

export type LiquidFx = "drop" | "spin" | "glow" | "wave" | "pop" | "none";

export type LiquidNavItem = {
  label: string;
  to: string;
  icon?: React.ReactNode;
  /** the little scene the icon plays when picked */
  fx?: LiquidFx;
};

export type LiquidNavbarProps = {
  items: LiquidNavItem[];
  /** index of the current page, or -1 when none of the items is current */
  active: number;
  /** "inline": icon beside label (top bar). "stacked": icon above label, full width (phone bottom bar). */
  layout?: "inline" | "stacked";
  label?: string;
  className?: string;
};

const PAD = 14; // canvas bleed around the pill, for shadows and ripples

/* ---------- styles ---------- */
const NAV_CSS = `
.lq-nav{--lq-tint:rgba(255,253,249,.55);--lq-fg:#1a2e24;--lq-fg-soft:#43534a;--lq-rim:rgba(255,255,255,.85);
  position:relative;display:inline-flex;align-items:center;gap:2px;padding:6px;border-radius:999px;isolation:isolate;
  font-family:var(--font-sans,"Source Sans 3",sans-serif);-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
.lq-nav ul{list-style:none;display:flex;gap:2px;margin:0;padding:0}
.lq-nav li{display:flex}
.lq-glass{position:absolute;inset:0;border-radius:inherit;z-index:-2;overflow:hidden;background:var(--lq-tint);
  -webkit-backdrop-filter:blur(14px) saturate(1.25) brightness(1.04);backdrop-filter:blur(14px) saturate(1.25) brightness(1.04);
  box-shadow:inset 0 1px 1px var(--lq-rim),inset 0 0 0 1px rgba(255,255,255,.45),0 14px 34px -16px rgba(26,46,36,.42),0 2px 6px rgba(26,46,36,.08)}
.lq-nav[data-refract="on"] .lq-glass{-webkit-backdrop-filter:url(#lq-refract) blur(3px) saturate(1.25) brightness(1.04);backdrop-filter:url(#lq-refract) blur(3px) saturate(1.25) brightness(1.04)}
.lq-water{position:absolute;left:${-PAD}px;top:${-PAD}px;z-index:-1;pointer-events:none}
.lq-nav[data-gl="off"] .lq-water{display:none}
.lq-drop{display:none;position:absolute;top:6px;bottom:6px;left:0;border-radius:999px;z-index:-1;pointer-events:none;will-change:transform,width;
  background:radial-gradient(120% 140% at 30% 0%,rgba(255,255,255,.85),rgba(255,255,255,0) 55%),rgba(201,164,92,.34);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.95),inset 0 -2px 6px rgba(150,112,40,.25),inset 0 0 0 1px rgba(255,255,255,.6),0 6px 16px -6px rgba(26,46,36,.4)}
.lq-nav[data-gl="off"] .lq-drop{display:block}
.lq-item{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:0 22px;border-radius:999px;
  color:var(--lq-fg-soft);font-family:inherit;font-weight:600;font-size:18px;line-height:1.1;letter-spacing:-.005em;text-decoration:none;cursor:pointer;transition:color .25s}
.lq-item:hover,.lq-item[aria-current="page"]{color:var(--lq-fg)}
.lq-item[aria-current="page"]{font-weight:700}
.lq-item:focus{outline:none}
.lq-item:focus-visible{outline:3px solid #1a2e24;outline-offset:3px;box-shadow:0 0 0 3px #f7f4ee}
.lq-nav[data-layout="stacked"]{--lq-tint:rgba(251,249,245,.86);display:flex;width:100%;border-radius:32px}
.lq-nav[data-layout="stacked"] ul{flex:1}
.lq-nav[data-layout="stacked"] li{flex:1}
.lq-nav[data-layout="stacked"] .lq-item{flex:1;flex-direction:column;gap:2px;min-height:64px;padding:4px 6px;border-radius:26px;text-align:center}
.lq-ico{position:relative;display:inline-flex;flex:none}
.lq-ico svg{transition:transform .45s cubic-bezier(.3,1.6,.5,1)}
.lq-item[aria-current="page"] .lq-ico svg{transform:translateY(-1px) scale(1.08)}
.lq-ico[data-fx="pop"] svg{animation:lqPop .5s cubic-bezier(.3,1.6,.5,1) both}
@keyframes lqPop{0%{transform:scale(.72)}60%{transform:scale(1.2)}100%{transform:translateY(-1px) scale(1.08)}}
.lq-ico[data-fx="drop"] svg{animation:lqDrop .95s cubic-bezier(.4,0,.3,1) both;transform-origin:50% 100%}
@keyframes lqDrop{0%{transform:translateY(-1px)}26%{transform:translateY(-13px) scale(.88,1.12)}46%{transform:translateY(3px) scale(1.3,.68)}62%{transform:translateY(-3px) scale(.92,1.08)}80%{transform:translateY(0) scale(1.04,.97)}100%{transform:translateY(-1px) scale(1.08)}}
.lq-ico[data-fx="spin"] svg{animation:lqSpin 1s cubic-bezier(.2,.75,.25,1) both}
@keyframes lqSpin{0%{transform:perspective(80px) rotateY(0)}100%{transform:perspective(80px) rotateY(360deg) translateY(-1px) scale(1.08)}}
.lq-ico[data-fx="glow"] svg{animation:lqHop .8s cubic-bezier(.3,1.4,.5,1) both;transform-origin:50% 100%}
@keyframes lqHop{0%{transform:none}30%{transform:translateY(-5px) scale(1.04,.96)}55%{transform:translateY(0) scale(1.12,.88)}75%{transform:translateY(-2px) scale(.98,1.04)}100%{transform:translateY(-1px) scale(1.08)}}
.lq-ico[data-fx="wave"] svg{animation:lqWave .9s ease-in-out both;transform-origin:50% 92%}
@keyframes lqWave{0%{transform:none}20%{transform:rotate(-15deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(4deg)}100%{transform:translateY(-1px) scale(1.08)}}
@media (prefers-reduced-motion:reduce){.lq-ico svg{animation:none!important;transition:none}.lq-item{transition:none}}
`;

/* ---------- the water shader (colours retuned to Cream, Brass and Forest) ---------- */
const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec4 uPill;
uniform vec4 uBlob[6];uniform float uSy[6];uniform vec4 uRip[6];uniform vec3 uMouse;uniform float uAmb;
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float sdCap(vec2 p,vec4 B,float sy){p-=B.xy;p.y/=sy;p.x=max(abs(p.x)-B.z,0.);return(length(p)-B.w)*min(1.,sy);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float dropD(vec2 p){float d=1e4;for(int i=0;i<6;i++){if(uBlob[i].w>.5){d=smin(d,sdCap(p,uBlob[i],uSy[i]),13.);}}return d;}
float pillD(vec2 p){vec2 h=uPill.zw*.5;return sdRB(p-uPill.xy-h,h,min(h.y,32.));}
float lens(float d,float w){float t=clamp(-d/w,0.,1.);return sqrt(1.-(1.-t)*(1.-t));}
float waves(vec2 p){float w=0.;
 for(int i=0;i<6;i++){vec4 R=uRip[i];if(R.w>0.){float x=length(p-R.xy)-R.z*240.;w+=R.w*exp(-R.z*1.7)*sin(x*.3)*exp(-x*x/700.);}}
 vec2 m=p-uMouse.xy;w+=uMouse.z*3.6*exp(-dot(m,m)/1000.);
 w+=uAmb*(sin(p.x*.05+uTime*1.2)*.45+sin(p.x*.13-uTime*.85+p.y*.2)*.25);return w;}
float H(vec2 p){float dp=pillD(p);return lens(dp,uPill.w*.36)*2.4+lens(dropD(p),11.)*7.5+waves(p)*smoothstep(0.,7.,-dp);}
float caus(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.1+t),cos(q.x*1.3-t*.7))*.6;c+=1./(1.+16.*abs(sin(q.x)*sin(q.y)));}return c/3.;}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;
 float dp=pillD(p);float dd=dropD(p);
 float h0=H(p);vec3 n=normalize(vec3(h0-H(p+vec2(1.,0.)),h0-H(p+vec2(0.,1.)),1.));
 vec3 V=vec3(0.,0.,1.);
 float spec=pow(max(dot(reflect(-normalize(vec3(-.45,-.8,.85)),n),V),0.),70.);
 float spec2=pow(max(dot(reflect(-normalize(vec3(.6,.75,.7)),n),V),0.),22.)*.3;
 float fres=clamp((1.-n.z)*4.,0.,1.);
 vec3 irid=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fres*.85+p.x*.0028+uTime*.035));
 irid=mix(vec3(1.,.93,.78),irid,.25);
 float pm=smoothstep(1.,-1.,dp);float dm=smoothstep(1.,-1.,dd)*smoothstep(1.,-2.,dp);
 float sh=smoothstep(9.,-9.,dropD(p-vec2(0.,5.)))*(1.-dm)*pm*.12;
 vec3 c=vec3(.10,.18,.14)*sh;float a=sh;
 float pa=clamp(pm*(fres*.5+spec*.9+spec2),0.,1.);
 c=mix(vec3(1.),irid,.5*fres)*pa+c*(1.-pa);a=pa+a*(1.-pa);
 float th=lens(dd,11.);
 float cs=caus((p+n.xy*th*18.)*.085,uTime*.9);
 vec3 tint=vec3(.97,.90,.74);
 float rim=dm*(1.-smoothstep(0.,8.,-dd));
 float cres=dm*smoothstep(.12,.55,dot(n.xy,normalize(vec2(.55,.85))))*smoothstep(0.,3.,-dd);
 float body=.5+.5*clamp(-n.y*3.,-1.,1.);
 float da=dm*(.34+.14*body);vec3 dc=mix(tint,vec3(1.),body*.5);
 float la=rim*.3;vec3 lc=vec3(.66,.51,.24);dc=lc*la+dc*da*(1.-la);da=la+da*(1.-la);
 la=clamp(cres*.7+smoothstep(.6,1.,cs)*.28*th*dm,0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=clamp(dm*(spec*1.2+spec2*.5),0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);
 la=dm*smoothstep(-2.,0.,dd)*.4;dc=mix(vec3(1.),irid,.35)*la+dc*(1.-la);da=la+da*(1.-la);
 c=dc+c*(1.-da);a=da+a*(1.-da);
 gl_FragColor=vec4(c,a);
}`;

type Body = { x: number; v: number };
type Sat = { x: number; y: number; vx: number; vy: number; r: number; k: number };
type Rip = { x: number; y: number; age: number; amp: number };

function makeState() {
  return {
    a: { x: 0, v: 0 } as Body,
    b: { x: 0, v: 0 } as Body,
    sy: { s: 1, v: 0 },
    lead: 0 as 0 | 1,
    lagFrom: 0,
    sats: [] as Sat[],
    rips: [] as Rip[],
    t: { x: 0, cy: 0, q: 0, r: 28 },
    q: 0,
    mouse: { x: 0, y: 0, s: 0, on: false },
    moving: false,
    split: false,
    ready: false,
    hidden: false,
    w: 0,
    h: 0,
    visible: true,
    reduce: false,
    raf: 0,
    last: 0,
    time: 0,
    glc: null as null | { gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null> },
  };
}

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }) as WebGLRenderingContext | null;
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  gl.useProgram(p);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(p, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ["uRes", "uDpr", "uTime", "uPill", "uBlob", "uSy", "uRip", "uMouse", "uAmb"]) u[n] = gl.getUniformLocation(p, n);
  return { gl, u };
}

function supportsRefraction() {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  const ua = navigator.userAgent;
  return /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua) && !!CSS.supports?.("backdrop-filter", "url(#a)");
}

export function LiquidNavbar({ items, active, layout = "inline", label = "Main", className }: LiquidNavbarProps) {
  const navRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const dropRef = React.useRef<HTMLSpanElement>(null);
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const iconRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const st = React.useRef(makeState());
  const [gl, setGl] = React.useState<"on" | "off">("on");
  const [refract, setRefract] = React.useState(false);
  const [fx, setFx] = React.useState({ i: -1, n: 0 });
  const filterId = React.useId().replace(/:/g, "");

  /* ---- drawing ---- */
  const draw = React.useCallback(() => {
    const s = st.current;
    const T = s.t;
    const sep = Math.abs(s.a.x - s.b.x);
    const thin = Math.min(sep / (2 * (s.q + T.r) || 1), 1);
    const r = T.r * (1 - 0.3 * thin);
    if (s.glc) {
      const { gl: g, u } = s.glc;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
      g.uniform2f(u.uRes, s.w + PAD * 2, s.h + PAD * 2);
      g.uniform1f(u.uDpr, dpr);
      g.uniform1f(u.uTime, s.time);
      g.uniform4f(u.uPill, PAD, PAD, s.w, s.h);
      const blobs = new Float32Array(24);
      const sy = new Float32Array(6).fill(1);
      if (!s.hidden) {
        const head = s.lead === 0 ? s.a : s.b;
        const tail = s.lead === 0 ? s.b : s.a;
        blobs.set(
          [head.x, T.cy, s.q * (1 - 0.25 * thin), T.r * (1 - 0.12 * thin), tail.x, T.cy, s.q * (1 - 0.8 * thin), T.r * (1 - 0.5 * thin)],
          0,
        );
        sy[0] = sy[1] = s.sy.s;
        s.sats.slice(0, 4).forEach((d, i) => blobs.set([d.x, d.y, 0, d.r], 8 + i * 4));
      }
      g.uniform4fv(u.uBlob, blobs);
      g.uniform1fv(u.uSy, sy);
      const rips = new Float32Array(24);
      s.rips.slice(-6).forEach((p, i) => rips.set([p.x, p.y, p.age, p.amp], i * 4));
      g.uniform4fv(u.uRip, rips);
      g.uniform3f(u.uMouse, s.mouse.x, s.mouse.y, s.mouse.s);
      g.uniform1f(u.uAmb, s.reduce ? 0 : 1);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      g.drawArrays(g.TRIANGLES, 0, 3);
    } else if (dropRef.current) {
      const left = Math.min(s.a.x, s.b.x) - s.q - r - PAD;
      const width = sep + 2 * (s.q + r);
      dropRef.current.style.opacity = s.hidden ? "0" : "1";
      dropRef.current.style.width = `${width}px`;
      dropRef.current.style.transform = `translateX(${left}px) scaleY(${s.sy.s})`;
    }
  }, []);

  /* ---- physics ---- */
  const step = React.useCallback((dt: number, now: number) => {
    const s = st.current;
    const T = s.t;
    s.time += dt;
    s.q += (T.q - s.q) * Math.min(1, dt * 12);
    const bodies = [s.a, s.b];
    let still = true;
    if (s.reduce) {
      s.a.x = s.b.x = T.x;
      s.a.v = s.b.v = 0;
      s.sy.s = 1;
      s.sats = [];
    } else {
      bodies.forEach((B, i) => {
        const lead = i === s.lead;
        const k = lead ? 210 : 72;
        const c = lead ? 25 : 13;
        const f = !lead && now < s.lagFrom ? 0.08 : 1;
        B.v += (k * (T.x - B.x) - c * B.v) * dt * f;
        B.x += B.v * dt;
        const lo = PAD + 6 + s.q + T.r - 3;
        const hi = PAD + s.w - 6 - s.q - T.r + 3;
        if (B.x < lo || B.x > hi) {
          s.sy.v -= Math.min(Math.abs(B.v), 900) * 0.0016;
          B.x = Math.max(lo, Math.min(hi, B.x));
          B.v *= -0.25;
        }
        if (Math.abs(T.x - B.x) > 0.3 || Math.abs(B.v) > 3) still = false;
      });
      const L = bodies[s.lead];
      const syT = 1 - 0.2 * Math.min(Math.abs(L.v) / 1500, 1);
      s.sy.v += (280 * (syT - s.sy.s) - 9 * s.sy.v) * dt;
      s.sy.s += s.sy.v * dt;
      if (Math.abs(s.sy.s - 1) > 0.002 || Math.abs(s.sy.v) > 0.02) still = false;
      const sep = Math.abs(s.a.x - s.b.x);
      const r = T.r * (1 - 0.3 * Math.min(sep / (2 * (T.q + T.r) || 1), 1));
      if (!s.split && s.moving && sep - 2 * T.q - 2 * r > -6) {
        s.split = true;
        const lo = bodies[1 - s.lead];
        const hi = bodies[s.lead];
        [0.3, 0.5, 0.72].forEach((t, j) => {
          s.sats.push({
            x: lo.x + (hi.x - lo.x) * t + (Math.random() - 0.5) * 6,
            y: T.cy + (Math.random() - 0.5) * 10,
            vx: (lo.v + hi.v) * 0.45,
            vy: (Math.random() - 0.5) * 60,
            r: 6 + Math.random() * 3 - j * 0.5,
            k: 70 + Math.random() * 90,
          });
        });
      }
      s.sats = s.sats.filter((d) => {
        d.vx += (d.k * (T.x - d.x) - 9 * d.vx) * dt;
        d.vy += (90 * (T.cy - d.y) - 7 * d.vy) * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.x = Math.max(PAD + 8 + d.r, Math.min(PAD + s.w - 8 - d.r, d.x));
        d.y = Math.max(T.cy - T.r + d.r, Math.min(T.cy + T.r - d.r, d.y));
        if (Math.abs(T.x - d.x) < T.q + T.r * 0.5) d.r -= dt * 26;
        return d.r > 0.6;
      });
      if (s.sats.length) still = false;
    }
    if (s.moving && still) {
      s.moving = false;
      if (!s.reduce) s.rips.push({ x: T.x, y: T.cy, age: 0, amp: s.split ? 1.2 : 0.7 });
    }
    s.rips.forEach((p) => (p.age += dt));
    s.rips = s.rips.filter((p) => p.age < 2.4);
    const target = s.mouse.on ? 1 : 0;
    s.mouse.s += (target - s.mouse.s) * Math.min(1, dt * 7);
  }, []);

  const loop = React.useCallback(() => {
    const s = st.current;
    if (s.raf) return;
    s.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      step(dt, now);
      draw();
      const busy = s.moving || s.rips.length || s.sats.length || s.mouse.s > 0.01;
      // Ambient water keeps moving while visible; with reduced motion it only redraws on change.
      if (s.visible && (!s.reduce || busy)) s.raf = requestAnimationFrame(tick);
      else s.raf = 0;
    };
    s.raf = requestAnimationFrame(tick);
  }, [draw, step]);

  /* ---- layout ---- */
  const measure = React.useCallback(() => {
    const nav = navRef.current;
    if (!nav || !nav.offsetWidth) return;
    const s = st.current;
    s.w = nav.offsetWidth;
    s.h = nav.offsetHeight;
    s.hidden = active < 0;
    const el = itemRefs.current[Math.max(0, active)];
    if (el) {
      const T = s.t;
      const parent = el.offsetParent === nav ? { x: 0, y: 0 } : { x: (el.offsetParent as HTMLElement)?.offsetLeft ?? 0, y: (el.offsetParent as HTMLElement)?.offsetTop ?? 0 };
      T.r = el.offsetHeight / 2;
      T.q = Math.max(0, el.offsetWidth / 2 - T.r);
      T.cy = PAD + parent.y + el.offsetTop + el.offsetHeight / 2;
      const nx = PAD + parent.x + el.offsetLeft + el.offsetWidth / 2;
      if (!s.ready) {
        s.a.x = s.b.x = nx;
        s.q = T.q;
        s.ready = true;
      } else if (Math.abs(nx - T.x) > 0.5) {
        s.lead = Math.abs(nx - s.a.x) <= Math.abs(nx - s.b.x) ? 0 : 1;
        s.lagFrom = performance.now() + 70;
        s.moving = true;
        s.split = false;
      }
      T.x = nx;
    }
    const cv = canvasRef.current;
    if (cv) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = s.w + PAD * 2;
      const Hh = s.h + PAD * 2;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(Hh * dpr);
        cv.style.width = `${W}px`;
        cv.style.height = `${Hh}px`;
      }
    }
    loop();
  }, [active, loop]);

  React.useEffect(() => {
    setRefract(supportsRefraction());
    const s = st.current;
    s.reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const cv = canvasRef.current;
    s.glc = cv ? initGL(cv) : null;
    if (!s.glc) setGl("off");
    const lost = (e: Event) => {
      e.preventDefault();
      s.glc = null;
      setGl("off");
    };
    cv?.addEventListener("webglcontextlost", lost);
    const io = new IntersectionObserver(([e]) => {
      s.visible = e.isIntersecting;
      if (s.visible) loop();
    });
    if (navRef.current) io.observe(navRef.current);
    const vis = () => {
      s.visible = document.visibilityState === "visible";
      if (s.visible) loop();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cv?.removeEventListener("webglcontextlost", lost);
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [loop]);

  React.useLayoutEffect(() => {
    measure();
  }, [measure, items.length, layout]);

  const measureRef = React.useRef(measure);
  measureRef.current = measure;
  React.useEffect(() => {
    let lastW = -1;
    const ro = new ResizeObserver(() => {
      const w = navRef.current?.offsetWidth ?? 0;
      if (w !== lastW) {
        lastW = w;
        st.current.ready = false;
        measureRef.current();
      }
    });
    if (navRef.current) ro.observe(navRef.current);
    // Fonts change item widths once they load.
    document.fonts?.ready.then(() => {
      st.current.ready = false;
      measureRef.current();
    });
    return () => ro.disconnect();
  }, []);

  /* ---- interaction ---- */
  const local = (clientX: number, clientY: number) => {
    const r = navRef.current!.getBoundingClientRect();
    return { x: clientX - r.left + PAD, y: clientY - r.top + PAD };
  };
  const ripple = (x: number, y: number, amp: number) => {
    const s = st.current;
    if (s.reduce) return;
    s.rips.push({ x, y, age: 0, amp });
    loop();
  };

  const select = (i: number) => {
    setFx((f) => ({ i, n: f.n + 1 }));
    const el = iconRefs.current[i];
    if (el && items[i]?.fx === "drop") {
      const b = el.getBoundingClientRect();
      const c = local(b.left + b.width / 2, b.top + b.height / 2);
      setTimeout(() => ripple(c.x, st.current.t.cy, 1.4), 430);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    const from = itemRefs.current.findIndex((el) => el === document.activeElement);
    if (from < 0) return;
    e.preventDefault();
    const n =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? items.length - 1
          : (from + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    itemRefs.current[n]?.focus();
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const p = local(e.clientX, e.clientY);
    const s = st.current;
    s.mouse.x = p.x;
    s.mouse.y = p.y;
    s.mouse.on = true;
    loop();
  };

  const css = NAV_CSS.replace(/#lq-refract/g, `#${filterId}`);

  return (
    <nav
      ref={navRef}
      className={["lq-nav", className].filter(Boolean).join(" ")}
      data-gl={gl}
      data-layout={layout}
      data-refract={refract ? "on" : "off"}
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerMove={onMove}
      onPointerLeave={() => {
        st.current.mouse.on = false;
        loop();
      }}
      onPointerDown={(e) => {
        const p = local(e.clientX, e.clientY);
        ripple(p.x, p.y, 0.8);
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves={2} seed={7} result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="60" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <span className="lq-glass" aria-hidden="true" />
      <canvas className="lq-water" ref={canvasRef} aria-hidden="true" />
      <span className="lq-drop" ref={dropRef} aria-hidden="true" />
      <ul>
        {items.map((it, i) => {
          const kind = it.fx ?? "pop";
          const playing = fx.i === i && kind !== "none";
          return (
            <li key={it.to}>
              <Link
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                to={it.to}
                className="lq-item"
                aria-current={i === active ? "page" : undefined}
                onClick={() => select(i)}
              >
                {it.icon ? (
                  <span
                    className="lq-ico"
                    key={playing ? fx.n : 0}
                    data-fx={playing ? kind : undefined}
                    ref={(el) => {
                      iconRefs.current[i] = el;
                    }}
                    aria-hidden="true"
                  >
                    {it.icon}
                  </span>
                ) : null}
                <span className="lq-label">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default LiquidNavbar;
