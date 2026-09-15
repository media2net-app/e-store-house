"use client";

import { useMemo, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  name: string;
};

export default function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const galleryImages = useMemo(() => {
    const filtered = images.filter(Boolean);
    return filtered.length > 0 ? filtered : [""];
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const prevImage = () => {
    setSelectedIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setSelectedIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div>
      <div className="flex items-start gap-3">
        {galleryImages.length > 1 ? (
          <div className="hidden w-20 shrink-0 flex-col gap-2 lg:flex">
            {galleryImages.slice(0, 6).map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                className={`overflow-hidden rounded-lg border ${
                  index === selectedIndex ? "border-[#251136]" : "border-[#e7def2]"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src={imageUrl}
                  alt={`${name} miniatura ${index + 1}`}
                  className="aspect-square w-full bg-[#f8f5fc] object-contain"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative min-w-0 flex-1">
          <img
            src={galleryImages[selectedIndex]}
            alt={name}
            className="aspect-square w-full rounded-2xl border border-[#e7def2] bg-[#f8f5fc] object-contain"
          />

          {galleryImages.length > 1 ? (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#251136] shadow transition hover:bg-white"
                onClick={prevImage}
                aria-label="Imaginea anterioara"
              >
                &#8592;
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#251136] shadow transition hover:bg-white"
                onClick={nextImage}
                aria-label="Imaginea urmatoare"
              >
                &#8594;
              </button>
            </>
          ) : null}
        </div>
      </div>

      {galleryImages.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3 lg:hidden">
          {galleryImages.slice(0, 8).map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              className={`overflow-hidden rounded-lg border ${
                index === selectedIndex ? "border-[#251136]" : "border-[#e7def2]"
              }`}
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={imageUrl}
                alt={`${name} miniatura ${index + 1}`}
                className="aspect-square w-full bg-[#f8f5fc] object-contain"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
