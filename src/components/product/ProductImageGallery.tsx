"use client";
import { useProductSelection } from "./ProductSelection";
import { useRef, useState } from "react";
import Image from "next/image";
type Props = { images: string[]; name: string };
export default function ProductImageGallery({ images, name }: Props) {
  const selection = useProductSelection();
  const activeImages = selection?.selected?.images ?? images;
  return <Gallery key={activeImages.join('|')} images={activeImages.filter(Boolean)} name={name}/>;
}
function Gallery({images,name}: Props) {
  const [index,setIndex] = useState(0);
  const [failed,setFailed] = useState(false);
  const start = useRef<number | null>(null);
  const zoom = useRef<HTMLDialogElement>(null);
  const move = (step: number) => { setIndex(i => (i + step + images.length) % images.length); setFailed(false); };
  return <div className="product-gallery">
    <div className="gallery-stage" onTouchStart={e => {start.current = e.changedTouches[0].clientX;}} onTouchEnd={e => { if (start.current !== null && images.length > 1) { const delta = e.changedTouches[0].clientX-start.current; if(Math.abs(delta)>45) move(delta>0?-1:1); } start.current=null; }}>
      {images[index] && !failed ? <button className="gallery-zoom" onClick={() => zoom.current?.showModal()} aria-label="Mărește fotografia produsului"><Image src={images[index]} alt={name} width={700} height={700} sizes="(max-width: 700px) 90vw, 50vw" loading="eager" onError={() => setFailed(true)}/></button> : <div className="image-placeholder">Fotografie indisponibilă</div>}
      {images.length>1 && <><button className="gallery-prev" aria-label="Imaginea anterioară" onClick={() => move(-1)}>←</button><button className="gallery-next" aria-label="Imaginea următoare" onClick={() => move(1)}>→</button></>}
    </div>
    <div className="gallery-caption"><span aria-live="polite">{images.length ? index+1 : 0} / {images.length} imagini</span>{images[index] && !failed && <button onClick={() => zoom.current?.showModal()}>Mărește imaginea ⤢</button>}</div>
    {images.length>1 && <div className="gallery-thumbnails">{images.map((src,i) => <button key={`${src}-${i}`} aria-label={`Vezi imaginea ${i+1}`} aria-pressed={index===i} onClick={() => {setIndex(i);setFailed(false);}}><Image src={src} alt="" width={96} height={96} sizes="64px"/></button>)}</div>}
    <dialog ref={zoom} className="store-dialog zoom-dialog" aria-label="Fotografia mărită" onClick={e => {if(e.target===e.currentTarget)zoom.current?.close();}}><div className="dialog-heading"><p>{name}</p><button aria-label="Închide fotografia mărită" onClick={() => zoom.current?.close()}>✕</button></div>{images[index] && <img src={images[index]} alt={name}/>}</dialog>
  </div>;
}
