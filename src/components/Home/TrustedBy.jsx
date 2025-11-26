/* eslint-disable react/no-unknown-property */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { HomeContentRepository } from '../../repositories/HomeContent.repository.js';

const placeholderSrc = 'https://dummyimage.com/96x96/ffffff/cccccc.png&text=%20';
const DEFAULT_LOGOS = [
  { alt: 'Club 1', src: placeholderSrc },
  { alt: 'Club 2', src: placeholderSrc },
  { alt: 'Club 3', src: placeholderSrc },
  { alt: 'Club 4', src: placeholderSrc },
  { alt: 'Club 5', src: placeholderSrc },
  { alt: 'Club 6', src: placeholderSrc },
  { alt: 'Club 7', src: placeholderSrc },
  { alt: 'Club 8', src: placeholderSrc },
  { alt: 'Club 9', src: placeholderSrc },
  { alt: 'Club 10', src: placeholderSrc },
  { alt: 'Club 11', src: placeholderSrc },
  { alt: 'Club 12', src: placeholderSrc },
  { alt: 'Club 13', src: placeholderSrc },
  { alt: 'Club 14', src: placeholderSrc },
  { alt: 'Club 15', src: placeholderSrc }
];

const TrustedBy = () => {
  const [logos, setLogos] = useState(DEFAULT_LOGOS);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const repository = new HomeContentRepository();

  useEffect(() => {
    loadLogos();
  }, []);

  const loadLogos = async () => {
    try {
      const data = await repository.getTrustedBy();
      if (data && data.length > 0) {
        setLogos(data);
      }
    } catch (error) {
      console.info('Error loading logos:', error.message);
    }
  };

  // Duplicamos el set para crear loop continuo sin cortes
  const marqueeLogos = useMemo(
    () => [
      ...logos.map((l, i) => ({ ...l, k: `a-${i}` })),
      ...logos.map((l, i) => ({ ...l, k: `b-${i}` }))
    ],
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    const speedPxPerFrame = 0.8; // velocidad suave
    let rafId;

    const step = () => {
      if (!container) {
        return;
      }
      container.scrollLeft += speedPxPerFrame;
      const half = (container.scrollWidth - container.clientWidth) / 2;
      if (container.scrollLeft >= half) {
        container.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section
      color-theme="beige"
      language=""
      className="py-16 bg-[#f3efe8]"
    >
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-8">
          Confiado por clubes y asociaciones en PEM
        </h2>

        {/* Carrusel horizontal con fade en bordes */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 8%, rgba(0,0,0,1) 92%, rgba(0,0,0,0))',
            maskImage:
              'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 8%, rgba(0,0,0,1) 92%, rgba(0,0,0,0))'
          }}
        >
          <div
            ref={trackRef}
            className="flex gap-5 md:gap-6 py-2 pr-6 pl-1 w-max"
            style={{ willChange: 'transform' }}
            aria-label="logos carrusel"
          >
            {marqueeLogos.map(logo => (
              <div
                key={`trusted-logo-${logo.k}`}
                className="rounded-2xl bg-white shadow-sm border border-black/5 p-4 flex items-center justify-center h-24 w-28 md:w-32 shrink-0"
                aria-label={logo.alt}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-12 object-contain opacity-90"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
