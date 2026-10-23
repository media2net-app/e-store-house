"use client";
import { useProductSelection } from "./ProductSelection";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
type Props = { images: string[]; name: string };
export default function ProductImageGallery({ images, name }: Props) {
  const selection = useProductSelection();
  const activeImages = selection?.selected?.images ?? images;
  return <Gallery key={activeImages.join('|')} images={activeImages.filter(Boolean)} name={name}/>;
}
function Gallery({ images, name }: Props) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (zoomOpen) zoom.current?.showModal(); }, [zoomOpen]);
  const select = (next: number) => {
    const target = (next + images.length) % images.length;
    viewport.current?.scrollTo({ left: target * viewport.current.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return <div className="product-gallery">
    <div className="gallery-stage">
      <div className="gallery-viewport" ref={viewport} onScroll={e => {
        const node = e.currentTarget;
        if (node.clientWidth) setIndex(Math.round(node.scrollLeft / node.clientWidth));
      }} aria-label="Fotografii produs — glisează pentru următoarea imagine">
        {images.map((src, i) => <button key={`${src}-${i}`} className="gallery-slide" tabIndex={i === index ? 0 : -1} onClick={() => setZoomOpen(true)} aria-label={`Mărește fotografia ${i + 1}`}>
          <Image src={src} alt={`${name} — fotografia ${i + 1}`} fill sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 1023px) 90vw, 650px" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"}/>
        </button>)}
        {!images.length && <div className="image-placeholder">Fotografie indisponibilă</div>}
      </div>
      {images.length > 1 && <><button className="gallery-prev" aria-label="Imaginea anterioară" onClick={() => select(index - 1)}>←</button><button className="gallery-next" aria-label="Imaginea următoare" onClick={() => select(index + 1)}>→</button></>}
    </div>
    <div className="gallery-caption"><span aria-live="polite">{images.length ? index + 1 : 0} / {images.length} imagini</span>{images[index] && <button onClick={() => setZoomOpen(true)}>Mărește imaginea ⤢</button>}</div>
    {images.length > 1 && <div className="gallery-thumbnails">{images.map((src, i) => <button key={`${src}-${i}`} aria-label={`Vezi imaginea ${i + 1}`} aria-pressed={index === i} onClick={() => select(i)}><Image src={src} alt="" width={96} height={96} sizes="64px"/></button>)}</div>}
    {zoomOpen && <dialog ref={zoom} className="store-dialog zoom-dialog" aria-label="Fotografia mărită" onClose={() => setZoomOpen(false)} onClick={e => { if (e.target === e.currentTarget) zoom.current?.close(); }}>
      <div className="dialog-heading"><p>{name}</p><button aria-label="Închide fotografia mărită" onClick={() => zoom.current?.close()}>✕</button></div>
      <div className="zoom-image-stage"><Image src={images[index]} alt={name} fill sizes="(max-width: 700px) 94vw, 1050px" loading="eager"/></div>
    </dialog>}
  </div>;
}
