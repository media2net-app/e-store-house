"use client";
import { useEffect, useRef, useState } from "react";

export default function HeroScene({ name }: { name: string }) {
  const [ready, setReady] = useState(false);
  const layers = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    let active = true;
    const images = Array.from(layers.current?.querySelectorAll("img") ?? []);
    Promise.all(images.map((image) => image.decode())).then(() => { if (active) setReady(true); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  return <div className={`maison-scene${ready && !failed ? " is-ready" : ""}${paused ? " is-paused" : ""}`}>
    <img className="maison-still" src="/editorial/maison-complete-v2.webp" alt={name} fetchPriority="high" width="1672" height="941" />
    <div key={replay} ref={layers} className="maison-living" aria-hidden="true">
      <img className="maison-background" src="/editorial/maison-base-v2.webp" alt="" width="1672" height="941" onError={() => setFailed(true)} />
      <img className="maison-duvet" src="/editorial/maison-duvet.webp" alt="" width="1672" height="941" onError={() => setFailed(true)} />
      <img className="maison-pillow" src="/editorial/maison-pillow.webp" alt="" width="1672" height="941" onError={() => setFailed(true)} />
      <img className="maison-foreground" src="/editorial/maison-complete-v2.webp" alt="" width="1672" height="941" />
      <span className="maison-daylight" />
    </div>
    {ready && !failed && <div className="maison-scene-controls"><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? "Pornește animația pernei și pilotei" : "Oprește animația pernei și pilotei"}>{paused ? "▷" : "Ⅱ"}<span>{paused ? "Pornește" : "Pauză"}</span></button><button type="button" onClick={() => { setPaused(false); setReplay((value) => value + 1); }} aria-label="Revezi mișcarea pernei și pilotei">↻ <span>Revezi scena</span></button></div>}
  </div>;
}
