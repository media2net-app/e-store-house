"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function HeroScene({ name }: { name: string }) {
  const scene = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    let active = true;
    const restart = async () => {
      const element = scene.current;
      const image = element?.querySelector("img");
      if (!element || !image) return;
      const animations = element.getAnimations({ subtree: true });
      animations.forEach((animation) => animation.pause());
      try { await image.decode(); } catch { return; }
      if (!active || scene.current !== element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      animations.forEach((animation) => {
        animation.currentTime = 0;
        animation.play();
      });
    };
    const onPageShow = () => { void restart(); };
    void restart();
    window.addEventListener("pageshow", onPageShow);
    return () => { active = false; window.removeEventListener("pageshow", onPageShow); };
  }, [pathname]);

  return <div className="maison-scene" ref={scene}>
    <img src="/editorial/maison-nomada-v4.webp" alt={name} fetchPriority="high" width="1536" height="1024" />
    <span className="maison-daylight" aria-hidden="true" />
  </div>;
}
