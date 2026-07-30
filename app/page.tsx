"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

function playBray() {
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  master.gain.setValueAtTime(0.001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.42, ctx.currentTime + 0.03);
  master.gain.setValueAtTime(0.34, ctx.currentTime + 0.65);
  master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.55);
  filter.type = "bandpass";
  filter.frequency.value = 920;
  filter.Q.value = 1.2;
  filter.connect(master);
  master.connect(ctx.destination);

  [0, 0.62].forEach((offset, index) => {
    const osc = ctx.createOscillator();
    const wobble = ctx.createOscillator();
    const wobbleGain = ctx.createGain();
    osc.type = index ? "sawtooth" : "square";
    osc.frequency.setValueAtTime(index ? 315 : 245, ctx.currentTime + offset);
    osc.frequency.exponentialRampToValueAtTime(
      index ? 205 : 330,
      ctx.currentTime + offset + 0.48,
    );
    wobble.frequency.value = 19;
    wobbleGain.gain.value = 22;
    wobble.connect(wobbleGain);
    wobbleGain.connect(osc.frequency);
    osc.connect(filter);
    osc.start(ctx.currentTime + offset);
    wobble.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.72);
    wobble.stop(ctx.currentTime + offset + 0.72);
  });

  window.setTimeout(() => ctx.close(), 1800);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<Point>({ x: 0, y: 0 });
  const trail = useRef<Point[]>([]);
  const [hits, setHits] = useState(0);
  const [donkeyVisible, setDonkeyVisible] = useState(false);
  const [cracking, setCracking] = useState(false);

  useEffect(() => {
    pointer.current = { x: innerWidth / 2, y: innerHeight / 2 };
    trail.current = Array.from({ length: 18 }, () => ({ ...pointer.current }));

    const move = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("pointermove", move, { passive: true });

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    const draw = () => {
      const ratio = Math.min(devicePixelRatio, 2);
      if (canvas.width !== innerWidth * ratio || canvas.height !== innerHeight * ratio) {
        canvas.width = innerWidth * ratio;
        canvas.height = innerHeight * ratio;
        canvas.style.width = `${innerWidth}px`;
        canvas.style.height = `${innerHeight}px`;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      trail.current[0].x += (pointer.current.x - trail.current[0].x) * 0.48;
      trail.current[0].y += (pointer.current.y - trail.current[0].y) * 0.48;
      for (let i = 1; i < trail.current.length; i++) {
        const lead = trail.current[i - 1];
        const point = trail.current[i];
        point.x += (lead.x - point.x) * 0.36;
        point.y += (lead.y - point.y) * 0.36;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(trail.current[17].x, trail.current[17].y);
      for (let i = 16; i >= 0; i--) {
        ctx.lineTo(trail.current[i].x, trail.current[i].y);
      }
      ctx.strokeStyle = "#21140c";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = "#f4b73c";
      ctx.lineWidth = 2;
      ctx.stroke();

      const tip = trail.current[17];
      const before = trail.current[14];
      const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(angle);
      ctx.fillStyle = "#6e321b";
      ctx.fillRect(-3, -5, 30, 10);
      ctx.fillStyle = "#f4b73c";
      ctx.fillRect(21, -7, 8, 14);
      ctx.restore();

      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  const crack = useCallback(() => {
    setCracking(true);
    window.setTimeout(() => setCracking(false), 260);
    setHits((current) => {
      const next = current + 1;
      if (next >= 5) {
        setDonkeyVisible(true);
        playBray();
        window.setTimeout(() => setDonkeyVisible(false), 3600);
        return 0;
      }
      return next;
    });
  }, []);

  return (
    <main onPointerDown={crack}>
      <canvas ref={canvasRef} className="whip-canvas" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header>
        <span className="stamp">باشگاه شلاق</span>
        <span className="sound-note">صدا روشن است ●</span>
      </header>

      <section className="hero">
        <p className="eyebrow">هدف‌گیری کن · کلیک کن · غافلگیر شو</p>
        <h1>پنج ضربه<br /><em>تا عرعر!</em></h1>
        <p className="instructions">
          شلاق همراه نشانگر توست. هر جا خواستی کلیک کن؛
          <br />ضربه‌ی پنجم مهمان ویژه را بیدار می‌کند.
        </p>

        <div className="counter" aria-live="polite">
          <div className="marks">
            {[0, 1, 2, 3, 4].map((index) => (
              <span key={index} className={index < hits ? "filled" : ""}>
                {index < hits ? "×" : "○"}
              </span>
            ))}
          </div>
          <strong>{hits === 0 ? "آماده‌ای؟" : `${5 - hits} ضربه مانده`}</strong>
        </div>
      </section>

      <div className={`crack ${cracking ? "active" : ""}`} style={{
        left: pointer.current.x,
        top: pointer.current.y,
      }} aria-hidden="true">
        <i /><i /><i />
      </div>

      <aside className={`donkey-stage ${donkeyVisible ? "show" : ""}`} aria-live="assertive">
        <div className="shout">عــــــــر عــــــــر!</div>
        <div className="donkey" role="img" aria-label="خر کارتونی در حال عرعر کردن">
          <span className="ear left"> </span>
          <span className="ear right"> </span>
          <span className="face">
            <b className="eye eye-left">•</b>
            <b className="eye eye-right">•</b>
            <i className="muzzle">ᴗ</i>
          </span>
          <span className="body"> </span>
          <span className="leg one"> </span>
          <span className="leg two"> </span>
          <span className="leg three"> </span>
          <span className="leg four"> </span>
          <span className="tail"> </span>
        </div>
      </aside>

      <footer>حرکت بده تا شلاق جان بگیرد</footer>
    </main>
  );
}
