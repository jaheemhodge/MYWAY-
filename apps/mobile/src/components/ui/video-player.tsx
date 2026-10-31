import { useEffect, useRef, useState } from "react";
import "./video-player.css";

/**
 * Video player with a floating glass control bar: play/pause, a seek bar with times, mute and
 * volume, and 0.5x–2x speed. Adapted for Mobility from 21st.dev "video-player".
 *
 * Changes from the original:
 * - No shadcn/lucide/framer-motion: native <input type="range"> sliders (keyboard and screen
 *   reader friendly), inline SVG icons, CSS transitions.
 * - Controls stay visible while paused and whenever a control has keyboard focus (the original
 *   only showed them on mouse hover, which hides them on touch screens).
 * - 56px buttons, 18px text. On phones the control bar sits under the video instead of over it.
 * - With no `src` it shows the poster (or a soft tone) and says the video is coming, rather than
 *   an empty black box.
 */
export type VideoPlayerProps = {
  src?: string;
  poster?: string;
  /** Background tone when there is neither video nor poster. */
  tone?: string;
  /** What the video shows, for screen readers. */
  label: string;
  /** Shown when there is no video yet. */
  emptyText?: string;
  className?: string;
};

const SPEEDS = [0.5, 1, 1.5, 2];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({ src, poster, tone, label, emptyText = "Video coming soon", className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setTime(0);
  }, [src]);

  if (!src) {
    return (
      <div className={["vp", "vp--empty", className].filter(Boolean).join(" ")}>
        <div className="vp__stage" style={poster ? undefined : { background: tone }}>
          {poster ? <img className="vp__media" src={poster} alt="" /> : null}
          <span className="vp__soon">{emptyText}</span>
        </div>
      </div>
    );
  }

  const v = () => videoRef.current;
  const toggle = () => {
    const el = v();
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  return (
    <div className={["vp", playing ? "is-playing" : "is-paused", className].filter(Boolean).join(" ")}>
      <div className="vp__stage">
      <video
        ref={videoRef}
        className="vp__media"
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        aria-label={label}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />

      {!playing ? (
        <button type="button" className="vp__big" onClick={toggle} aria-label={`Play: ${label}`}>
          <PlayIcon size={34} />
        </button>
      ) : null}
      </div>

      <div className="vp__bar">
        <div className="vp__row">
          <span className="vp__time">{formatTime(time)}</span>
          <input
            className="vp__range vp__seek"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            aria-label="Position"
            aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
            style={{ ["--vp-fill" as string]: `${duration ? (time / duration) * 100 : 0}%` }}
            onChange={(e) => {
              const el = v();
              if (!el) return;
              el.currentTime = Number(e.target.value);
              setTime(el.currentTime);
            }}
          />
          <span className="vp__time">{formatTime(duration)}</span>
        </div>
        <div className="vp__row vp__row--controls">
          <div className="vp__group">
            <button type="button" className="vp__btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              className="vp__btn"
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
              onClick={() => {
                const el = v();
                if (!el) return;
                el.muted = !muted;
                setMuted(!muted);
              }}
            >
              <VolumeIcon level={muted ? 0 : volume} />
            </button>
            <input
              className="vp__range vp__vol"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volume"
              style={{ ["--vp-fill" as string]: `${(muted ? 0 : volume) * 100}%` }}
              onChange={(e) => {
                const el = v();
                const next = Number(e.target.value);
                if (el) {
                  el.volume = next;
                  el.muted = next === 0;
                }
                setVolume(next);
                setMuted(next === 0);
              }}
            />
          </div>
          <div className="vp__group" role="group" aria-label="Speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`vp__btn vp__speed${speed === s ? " is-on" : ""}`}
                aria-pressed={speed === s}
                onClick={() => {
                  const el = v();
                  if (el) el.playbackRate = s;
                  setSpeed(s);
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function VolumeIcon({ level }: { level: number }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
      {level === 0 ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          {level > 0.5 ? <path d="M18.5 5.5a9 9 0 0 1 0 13" /> : null}
        </>
      )}
    </svg>
  );
}
