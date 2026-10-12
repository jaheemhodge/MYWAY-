import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChairFigure } from "../components/illustrations";
import { Button } from "../components/ui/Primitives";
import { MOVEMENTS } from "../content/movements";
import { useApp } from "../store/AppState";

export function Player() {
  const { day = "1" } = useParams();
  const dayNum = Number(day);
  const { plan, state, dispatch } = useApp();
  const session = plan.find((item) => item.day === dayNum);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startIndex = state.sessionResume?.day === dayNum ? state.sessionResume.movementIndex : 0;
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(false);
  const [reps, setReps] = useState(state.sessionResume?.day === dayNum ? state.sessionResume.completedReps : 0);
  const [easier, setEasier] = useState(false);
  const [report, setReport] = useState(false);

  const playlist = useMemo(() => {
    if (!session) return [];
    if (session.movements.length) return session.movements;
    return [
      {
        ...MOVEMENTS.walk_comfortable,
        name: session.title,
        summary: session.summary,
        videoUrl: session.educationVideo,
      },
    ];
  }, [session]);

  const current = playlist[index];
  const targetReps = 8;

  useEffect(() => {
    dispatch({ type: "RESUME", value: { day: dayNum, movementIndex: index, completedReps: reps } });
  }, [dayNum, dispatch, index, reps]);

  if (!session || !current) return null;

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) {
      setPlaying((value) => !value);
      return;
    }
    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const replay = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play();
      setPlaying(true);
    }
  };

  if (report) {
    return (
      <section className="screen">
        <h1 className="display">Something doesn’t feel right?</h1>
        <p className="lede">
          Stop if you have chest pain, fainting, sudden weakness, or severe new pain. This app cannot
          diagnose the cause.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            dispatch({
              type: "CHECKIN",
              record: {
                day: dayNum,
                action: "pause_and_seek_assessment",
                blockNextSession: true,
                newOrConcerningSymptoms: true,
              },
            });
            navigate("/hold");
          }}
        >
          Stop and get guidance
        </Button>
        <Button variant="ghost" onClick={() => setReport(false)}>
          Return to the session
        </Button>
      </section>
    );
  }

  return (
    <section className="screen player">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="icon-btn" onClick={() => navigate(`/session/${dayNum}`)} aria-label="Close session">
          ×
        </button>
        <span className="pill">
          Movement {index + 1} of {playlist.length}
        </span>
        <span className="pill">{state.settings.audio ? "Voice on" : "Voice off"}</span>
      </div>
      <div className="hero-media" style={{ minHeight: 280 }}>
        <span className="placeholder-tag">Video placeholder</span>
        <span className="pill light" style={{ position: "absolute", top: 14, left: 14 }}>
          {playing ? "Playing" : "Paused"}
        </span>
        <video
          ref={videoRef}
          src={easier && current.altVideoUrl ? current.altVideoUrl : current.videoUrl}
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          controls={false}
        />
        <ChairFigure />
      </div>
      <h1 className="serif" style={{ fontSize: "2rem", marginBottom: 6 }}>
        {easier && current.easier ? current.easier.name : current.name}
      </h1>
      <p className="lede">{state.settings.captions ? current.summary : ""}</p>
      <div className="rep-row">
        <div>
          <span className="display" style={{ fontSize: "3rem" }}>
            {reps}
          </span>
          <small>of {targetReps} repetitions</small>
        </div>
        <div className="row">
          <button className="icon-btn" aria-label="Previous movement" onClick={() => setIndex((value) => Math.max(0, value - 1))}>
            ‹
          </button>
          <button className="play-btn" onClick={() => void toggle()} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            className="icon-btn"
            aria-label="Next movement"
            onClick={() => {
              if (index + 1 < playlist.length) {
                setIndex((value) => value + 1);
                setReps(0);
                setEasier(false);
              } else {
                navigate(`/checkin/${dayNum}`);
              }
            }}
          >
            ›
          </button>
        </div>
      </div>
      <p className="muted">Repetitions only advance when you choose. The video will not guess for you.</p>
      <Button variant="quiet" onClick={() => setReps((value) => Math.min(targetReps, value + 1))}>
        I completed a repetition
      </Button>
      <div className="player-actions">
        <button onClick={replay}>Replay</button>
        <button onClick={() => navigate(`/guide/${current.id}?day=${dayNum}`)}>Guide</button>
        <button onClick={() => current.easier && setEasier((value) => !value)} disabled={!current.easier}>
          {easier ? "Usual version" : "Easier version"}
        </button>
      </div>
      <Button variant="danger" onClick={() => setReport(true)}>
        Stop · Report discomfort
      </Button>
    </section>
  );
}
