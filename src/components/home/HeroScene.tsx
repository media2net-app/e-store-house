"use client";

import { useState, type PointerEvent } from "react";
import Link from "next/link";

export default function HeroScene({ href, image }: { href: string; image: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    setTilt({ x: ((event.clientY - box.top) / box.height - .5) * -5, y: ((event.clientX - box.left) / box.width - .5) * 7 });
  }
  return <div className="hero-scene" onPointerMove={move} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
    <div className="scene-halo" aria-hidden="true" />
    <div className="scene-outline" aria-hidden="true" />
    <div className="scene-frame" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y - 4}deg) rotateZ(1deg)` }}>
      <img src={image} alt="Lenjerie în nuanțe ivory, cu textură fină și detalii decorative" className="scene-photo" fetchPriority="high" />
      <Link href={href} className="scene-caption"><span><small>ÎN CENTRUL ATENȚIEI</small><strong>Frumusețea detaliilor.</strong></span><span aria-hidden="true">↗</span></Link>
    </div>
    <div className="scene-seal"><span>ATELIER DE CONFORT</span><strong>100%</strong><span>BUMBAC</span></div>
    <span className="scene-note">O invitație la tihnă.</span>
  </div>;
}
