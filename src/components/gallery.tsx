"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const shots = images.length > 0 ? images : ["/cars/hero-wide.jpg"];

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + shots.length) % shots.length),
    [shots.length],
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  return (
    <>
      <div className="group relative aspect-[16/10] overflow-hidden rounded-md img-ph">
        <Image
          src={shots[index]!}
          alt={`${title} — image ${index + 1} of ${shots.length}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover"
        />

        {shots.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <button
          onClick={() => setLightbox(true)}
          aria-label="Expand image"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-sm bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
        >
          <Expand size={16} />
        </button>

        <span className="num absolute bottom-3 right-3 rounded-xs bg-black/70 px-2 py-1 text-[11px] tabular-nums text-white backdrop-blur-sm">
          {index + 1} / {shots.length}
        </span>
      </div>

      {shots.length > 1 && (
        <div className="thin-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
          {shots.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={`relative h-[68px] w-[100px] shrink-0 overflow-hidden rounded-sm border-2 transition-colors img-ph ${
                i === index ? "border-brand-500" : "border-transparent hover:border-ink-200"
              }`}
            >
              <Image src={src} alt="" fill sizes="100px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} gallery`}
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            aria-label="Close gallery"
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-sm text-white transition-colors hover:bg-white/15"
          >
            <X size={22} />
          </button>

          <div
            className="relative h-full max-h-[85vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={shots[index]!}
              alt={`${title} — image ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {shots.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous image"
                className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next image"
                className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <span className="num absolute bottom-6 left-1/2 -translate-x-1/2 text-[13px] tabular-nums text-white/70">
            {index + 1} / {shots.length}
          </span>
        </div>
      )}
    </>
  );
}
