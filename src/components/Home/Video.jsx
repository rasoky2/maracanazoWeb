import React, { useEffect, useRef, useState } from 'react';
import { HomeContentRepository } from '../../repositories/HomeContent.repository.js';

const DEFAULT_SPORTS = [
  { title: 'Fútbol', poster: '/images/futbol1.jpg', mp4: '/videos/clip.mp4', webm: '/videos/clip.webm' },
  { title: 'Rugby', poster: '/images/futbol2.jpg', mp4: '/videos/clip.mp4', webm: '/videos/clip.webm' },
  { title: 'Vóley', poster: '/images/voley.jpg', mp4: '/videos/clip.mp4', webm: '/videos/clip.webm' }
];

const Video = () => {
  const [sports, setSports] = useState(DEFAULT_SPORTS);
  const containerRef = useRef(null);
  const repository = new HomeContentRepository();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await repository.getVideos();
      if (data && data.length > 0) {
        setSports(data);
      }
    } catch (error) {
      console.info('Error loading videos:', error.message);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videos = Array.from(container.querySelectorAll('video'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.0, 0.6, 1.0] }
    );

    videos.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Deportes que amamos</h2>
          <p className="text-lg text-gray-600">Explora clips y reserva tu próxima cancha.</p>
        </div>

        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {sports.map((s) => (
            <div key={s.title} className="snap-center shrink-0 w-[320px] rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl ring-1 ring-inset ring-white/10 shadow-lg">
              <div className="relative">
                <video
                  className="w-full h-56 object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={s.poster}
                >
                  <source src={s.mp4} type="video/mp4" />
                  { s.webm ? <source src={s.webm} type="video/webm" /> : null }
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
              </div>
              <div className="p-3">
                <h3 className="text-gray-900 font-semibold">{s.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Video;