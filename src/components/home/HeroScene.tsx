"use client";
import { useState } from "react";

export default function HeroScene({ name }: { name: string }) {
  const [paused, setPaused] = useState(false);

  return <div className={`maison-scene${paused ? " is-paused" : ""}`}>
    <img src="/editorial/maison-geometric-v3.webp" alt={name} fetchPriority="high" width="1536" height="1024" />
    <span className="maison-daylight" aria-hidden="true" />
    <div className="maison-scene-controls">
      <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? "Pornește mișcarea scenei" : "Oprește mișcarea scenei"}>
        <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span><span>{paused ? "Pornește" : "Pauză"}</span>
      </button>
    </div>
  </div>;
}
