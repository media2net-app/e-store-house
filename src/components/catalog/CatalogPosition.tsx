'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
export default function CatalogPosition(){const path=usePathname();useEffect(()=>{
 const save=(event:MouseEvent)=>{const target=event.target instanceof Element?event.target.closest('a'):null;if(target?.getAttribute('href')?.startsWith('/product/') && !path.startsWith('/product/')){try{sessionStorage.setItem('estore-catalog-position',JSON.stringify({path:location.pathname+location.search,y:scrollY}));}catch{}}};
 document.addEventListener('click',save,true);
 let frame=0;try{if(sessionStorage.getItem('estore-restore-catalog')==='yes'){const saved=JSON.parse(sessionStorage.getItem('estore-catalog-position')??'null');if(saved?.path===location.pathname+location.search){sessionStorage.removeItem('estore-restore-catalog');frame=requestAnimationFrame(()=>window.scrollTo({top:Number(saved.y)||0,behavior:'instant'}));}}}catch{}
 return()=>{document.removeEventListener('click',save,true);cancelAnimationFrame(frame);};},[path]);return null;}
