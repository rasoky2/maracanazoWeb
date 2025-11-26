import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { motion } from 'framer-motion';
import { HomeContentRepository } from '../../repositories/HomeContent.repository.js';

const DEFAULT_STEPS = [
  {
    title: 'Reserva tu cancha deportiva en Puerto Maldonado de manera fácil y rápida.',
    desc: 'Encuentra y reserva las mejores canchas deportivas en tu zona. Sistema simple y eficiente para gestionar tus reservas deportivas.',
    videoMp4: 'https://videos.pexels.com/video-files/2932306/2932306-uhd_4096_2160_24fps.mp4'
  },
  {
    title: 'Disfruta de canchas en óptimas condiciones con iluminación adecuada.',
    desc: 'Superficie cuidada, césped en perfecto estado y equipamiento disponible. Ideal para partidos diurnos y nocturnos.',
    videoMp4: 'https://videos.pexels.com/video-files/2932301/2932301-uhd_4096_2160_24fps.mp4'
  },
  {
    title: 'Confirma tu reserva y disfruta del partido con tu equipo.',
    desc: 'Recibe confirmación instantánea y prepárate para vivir momentos inolvidables en la cancha.',
    videoMp4: 'https://videos.pexels.com/video-files/5563400/5563400-uhd_3840_2160_30fps.mp4'
  }
];

const Steps = () => {
    const [steps, setSteps] = useState(DEFAULT_STEPS);
    const repository = new HomeContentRepository();

    useEffect(() => {
      loadSteps();
    }, []);

    const loadSteps = async () => {
      try {
        const data = await repository.getSteps();
        if (data && data.length > 0) {
          setSteps(data);
        }
      } catch (error) {
        console.info('Error loading steps:', error.message);
      }
    };

	const [current, setCurrent] = useState(0);
	const currentStep = useMemo(() => steps[current], [steps, current]);

// GSAP (sin ScrollTrigger) refs
const sectionRef = useRef(null);
const panelRef = useRef(null);
const videoWrapRef = useRef(null);
const videoRefs = useRef([]);
const bigNumberRef = useRef(null);

// Precarga inicial de todos los videos
useEffect(() => {
    for (const step of steps) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = step.videoMp4;
        document.head.appendChild(link);
    }
}, [steps]);

// Precarga y reproducción en segundo plano de todos los videos
useEffect(() => {
    // Iniciar reproducción de todos los videos en segundo plano (ocultos)
    for (let i = 0; i < videoRefs.current.length; i++) {
        const vid = videoRefs.current[i];
        if (!vid) {
            continue;
        }
        try {
            vid.muted = true;
            vid.defaultMuted = true;
            vid.preload = 'auto';
            // Forzar carga completa
            if (vid.readyState < 2) {
                vid.load();
            }
            // Reproducir todos en segundo plano para que estén listos
            const playPromise = vid.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } catch (err) {
            // Ignorar errores silenciosamente
        }
    }
}, [steps.length]);

// Mantener videos reproduciéndose y animar número grande
useEffect(() => {
    // Asegurar que todos los videos siguen reproduciéndose
    for (let i = 0; i < videoRefs.current.length; i++) {
        const vid = videoRefs.current[i];
        if (!vid) {
            continue;
        }
        try {
            if (vid.paused) {
                vid.play().catch(() => {});
            }
        } catch (err) {
            // Ignorar errores silenciosamente
        }
    }
    
    // Animar número grande al cambiar de step
    if (bigNumberRef.current) {
        gsap.to(bigNumberRef.current, {
            opacity: 0.2,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        });
    }
}, [current]);

// Inicializar Lenis para smooth scrolling
useEffect(() => {
    const lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.8,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false
    });

    // Conectar Lenis con GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Función de animación frame
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
        lenis.destroy();
    };
}, []);

// ScrollTrigger: pin + transición fade entre steps
useLayoutEffect(() => {
    if (!gsap.core.globals().ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }
    const el = sectionRef.current;
    if (!el) {
        return undefined;
    }

    const totalSteps = steps.length;
    let lastIdx = current;

    const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${window.innerHeight * totalSteps * 1.2}`,
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
        onUpdate: self => {
            const progress = self.progress; // 0..1
            const seg = 1 / totalSteps;
            
            // Calcular índice actual basado en progreso
            const rawIdx = progress / seg;
            const idx = Math.min(totalSteps - 1, Math.max(0, Math.floor(rawIdx)));
            
            // Cambiar step solo si cambió el índice
            if (idx !== lastIdx) {
                lastIdx = idx;
                setCurrent(idx);
            }

            // Calcular progreso dentro del segmento actual (0..1)
            const segStart = idx * seg;
            const local = (progress - segStart) / seg;
            
            // Fade suave y gradual: crossfade limpio entre videos
            // El video actual está completamente visible (opacidad 1) en el segmento
            // Al final del segmento, el siguiente video comienza a aparecer
            const fadeZone = 0.3; // Zona de transición (30% del segmento)
            const currentOpacity = local < 1 - fadeZone ? 1 : 1 - ((local - (1 - fadeZone)) / fadeZone);
            
            // Calcular opacidad del siguiente video (si existe)
            const nextIdx = idx + 1;
            let nextOpacity = 0;
            if (nextIdx < totalSteps) {
                const nextSegStart = nextIdx * seg;
                // El siguiente video aparece al final del segmento actual
                if (progress >= nextSegStart - fadeZone * seg) {
                    const fadeStart = nextSegStart - fadeZone * seg;
                    const fadeProgress = (progress - fadeStart) / (fadeZone * seg);
                    nextOpacity = Math.min(1, Math.max(0, fadeProgress));
                }
            }
            
            // Aplicar opacidad a los wrappers de video con crossfade suave
            for (let i = 0; i < videoRefs.current.length; i++) {
                const vid = videoRefs.current[i];
                if (!vid?.parentElement) {
                    continue;
                }
                const wrapper = vid.parentElement;
                if (i === idx) {
                    // Video actual: fade out al final del segmento
                    gsap.set(wrapper, { opacity: currentOpacity, zIndex: currentOpacity > 0.5 ? 2 : 1, force3D: true });
                } else if (i === nextIdx && nextIdx < totalSteps) {
                    // Video siguiente: fade in suave
                    gsap.set(wrapper, { opacity: nextOpacity, zIndex: nextOpacity > 0.5 ? 2 : 1, force3D: true });
                } else {
                    // Otros videos: completamente ocultos
                    gsap.set(wrapper, { opacity: 0, zIndex: 0, force3D: true });
                }
            }
        }
    });

    return () => {
        st.kill();
    };
}, [steps.length, current]);

// La navegación y transiciones fade se manejan completamente con ScrollTrigger

	return (
        <section ref={sectionRef} className="py-16 bg-black text-white min-h-screen">
            <div className="px-4">
                <div className="mx-auto max-w-[95vw]">
                    <div className="py-8">
                        <div className="mb-10">
                            <div className="mx-auto max-w-3xl text-center">
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                    Reserva tu cancha deportiva <br className="hidden md:block" />en tres pasos simples
                                </h2>
                                {/* Sin indicadores superiores */}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="hidden lg:flex lg:col-span-2 flex-col items-start gap-4 select-none" aria-hidden="true">
                                <div className="text-gray-500 font-mono font-bold text-4xl">0</div>
                                <div className="flex flex-col gap-3">
                                    <div className={`font-mono font-bold text-4xl ${current===0? 'text-white' : 'text-gray-500'}`}>1</div>
                                    <div className={`font-mono font-bold text-4xl ${current===1? 'text-white' : 'text-gray-500'}`}>2</div>
                                    <div className={`font-mono font-bold text-4xl ${current===2? 'text-white' : 'text-gray-500'}`}>3</div>
                                </div>
                            </div>
                            <div className="lg:col-span-10 space-y-6">
								<motion.div
									key={`panel-${current}`}
									initial={{ opacity: 0, scale: 0.96 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.25 }}
									className="relative"
									ref={panelRef}
								>
                                    <div className="relative">
                                        <div
                                            ref={videoWrapRef}
                                            className="relative overflow-hidden rounded-2xl border border-gray-700 bg-black shadow-2xl will-change-transform origin-center"
                                            style={{ aspectRatio: '21/9', minHeight: '60vh' }}
                                        >
                                            {steps.map((step, idx) => (
                                                <div
                                                    key={`video-wrapper-${step.videoMp4}`}
                                                    className="absolute inset-0 bg-black"
                                                    style={{
                                                        opacity: idx === current ? 1 : 0,
                                                        zIndex: idx === current ? 2 : 1
                                                    }}
                                                >
                                                    <video
                                                        ref={el => { videoRefs.current[idx] = el; }}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                        loop
                                                        playsInline
                                                        preload="auto"
                                                    >
                                                        <source src={step.videoMp4} type="video/mp4" />
                                                    </video>
                                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                                                </div>
                                            ))}
										</div>
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <div
                                                aria-hidden="true"
                                                ref={bigNumberRef}
                                                className="pointer-events-none select-none font-extrabold leading-none text-white"
                                                style={{ fontSize: 'clamp(4rem, 16vw, 12rem)', opacity: 0.2 }}
                                            >
                                                {String(current + 1).padStart(2, '0')}
                                            </div>
                                            <div className="text-white/90 text-sm font-semibold mb-2">Paso {current + 1}</div>
                                            <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-lg">
                                                {currentStep.title}
                                            </h3>
                                            <p className="text-white/80 text-base">{currentStep.desc}</p>
                                        </div>
									</div>
								</motion.div>

							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Steps;
