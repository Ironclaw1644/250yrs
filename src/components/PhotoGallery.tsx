"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "./Icon";

type Photo = { url: string; alt_text: string | null };

/** Scroll-snap photo strip with a native <dialog> lightbox. */
export function PhotoGallery({ photos, name }: { photos: Photo[]; name: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  if (!photos.length) return null;

  function open(i: number) {
    setActive(i);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {photos.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => open(i)}
            className="relative h-40 w-60 shrink-0 snap-start overflow-hidden rounded-lg shadow-card transition-transform duration-std ease-warm hover:-translate-y-0.5 sm:h-48 sm:w-72"
            aria-label={`View photo ${i + 1} of ${name}`}
          >
            <Image
              src={p.url}
              alt={p.alt_text ?? name}
              fill
              sizes="288px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="w-[min(92vw,64rem)] rounded-xl bg-navy-deep p-0 backdrop:bg-navy-deep/80"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="relative aspect-[3/2] w-full">
          <Image
            src={photos[active].url}
            alt={photos[active].alt_text ?? name}
            fill
            sizes="90vw"
            className="object-contain"
          />
        </div>
        <div className="flex items-center justify-between p-3">
          <span className="text-small text-mist">
            {active + 1} / {photos.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary !min-h-9 border-cloud px-3 text-small !text-cloud"
              onClick={() => setActive((a) => (a - 1 + photos.length) % photos.length)}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary !min-h-9 px-3 text-small !text-cloud"
              onClick={() => setActive((a) => (a + 1) % photos.length)}
            >
              Next
            </button>
            <button
              type="button"
              className="btn btn-gold !min-h-9 px-3 text-small"
              onClick={() => dialogRef.current?.close()}
            >
              <Icon name="xmark" /> Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
