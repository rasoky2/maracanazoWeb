import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeContentRepository } from '../../repositories/HomeContent.repository.js';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const DEFAULT_STEPS = [
  {
    title: 'Reserva tu cancha deportiva en Puerto Maldonado de manera fácil y rápida.',
    desc: 'Encuentra y reserva las mejores canchas deportivas en tu zona. Sistema simple y eficiente para gestionar tus reservas deportivas.',
    imagen: '/images/futbol1.jpg'
  },
  {
    title: 'Disfruta de canchas en óptimas condiciones con iluminación adecuada.',
    desc: 'Superficie cuidada, césped en perfecto estado y equipamiento disponible. Ideal para partidos diurnos y nocturnos.',
    imagen: '/images/futbol2.jpg'
  },
  {
    title: 'Confirma tu reserva y disfruta del partido con tu equipo.',
    desc: 'Recibe confirmación instantánea y prepárate para vivir momentos inolvidables en la cancha.',
    imagen: '/images/estadio.jpg'
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
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);
	const autoPlayIntervalRef = useRef(null);

	// Auto-play del slider
	useEffect(() => {
		if (isAutoPlaying && steps.length > 1) {
			autoPlayIntervalRef.current = setInterval(() => {
				setCurrent(prev => (prev + 1) % steps.length);
			}, 5000); // Cambiar cada 5 segundos
		}

		return () => {
			if (autoPlayIntervalRef.current) {
				clearInterval(autoPlayIntervalRef.current);
			}
		};
	}, [isAutoPlaying, steps.length]);

	const handleNext = () => {
		setCurrent(prev => (prev + 1) % steps.length);
		setIsAutoPlaying(false);
		if (autoPlayIntervalRef.current) {
			clearInterval(autoPlayIntervalRef.current);
		}
	};

	const handlePrev = () => {
		setCurrent(prev => (prev - 1 + steps.length) % steps.length);
		setIsAutoPlaying(false);
		if (autoPlayIntervalRef.current) {
			clearInterval(autoPlayIntervalRef.current);
		}
	};

	const goToStep = (index) => {
		setCurrent(index);
		setIsAutoPlaying(false);
		if (autoPlayIntervalRef.current) {
			clearInterval(autoPlayIntervalRef.current);
		}
	};

	return (
        <section className="py-16 bg-black">
            <div className="px-4">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                Reserva tu cancha deportiva <br className="hidden md:block" />en tres pasos simples
                            </h2>
                        </div>
                    </div>
                    
                    <div className="relative">
                        {/* Efecto de niebla cinematográfica alrededor del contenedor */}
                        <div className="absolute inset-0 z-0 pointer-events-none"
                            style={{
                                background: `
                                    radial-gradient(ellipse 100% 100% at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 50%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 90%, rgba(0,0,0,0.8) 100%),
                                    radial-gradient(ellipse 110% 110% at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 40%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.7) 100%)
                                `,
                                filter: 'blur(40px)',
                                WebkitFilter: 'blur(40px)',
                                transform: 'scale(1.1)',
                                margin: '-20px'
                            }}
                        />
                        
                        {/* Contenedor principal con efecto de niebla */}
                        <div className="relative z-10 bg-black"
                            style={{ aspectRatio: '21/9', minHeight: '60vh' }}
                        >
                            {/* Capa de imagen/video nítida */}
                            <div className="relative w-full h-full">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={current}
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                                        className="absolute inset-0"
                                    >
                                        {currentStep.tipo === 'video' && currentStep.video ? (
                                            <video
                                                src={currentStep.video}
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                            />
                                        ) : (
                                            <img
                                                src={currentStep.imagen || '/images/futbol1.jpg'}
                                                alt={currentStep.title || `Paso ${current + 1}`}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            
                            {/* Efecto de niebla solo en la parte inferior para el texto */}
                            <div className="absolute inset-0 z-10 pointer-events-none"
                                style={{
                                    background: `
                                        linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0.5) 88%, rgba(0,0,0,0.8) 100%)
                                    `
                                }}
                            />

                            {/* Controles de navegación */}
                            {steps.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrev}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                                        aria-label="Anterior"
                                    >
                                        <FaChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                                        aria-label="Siguiente"
                                    >
                                        <FaChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            {/* Contenido del paso */}
                            <div className="absolute bottom-6 left-6 right-6 z-10">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none select-none font-extrabold leading-none text-white"
                                    style={{ fontSize: 'clamp(4rem, 16vw, 12rem)', opacity: 0.2 }}
                                >
                                    {String(current + 1).padStart(2, '0')}
                                </div>
                                <div className="text-white/90 text-sm font-semibold mb-2">Paso {current + 1}</div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-lg">
                                    {currentStep.title}
                                </h3>
                                <p className="text-white/80 text-base max-w-2xl">{currentStep.desc}</p>
                            </div>
                        </div>

                        {/* Indicadores de pasos */}
                        {steps.length > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {steps.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => goToStep(idx)}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            idx === current 
                                                ? 'bg-white w-8' 
                                                : 'bg-white/40 w-2 hover:bg-white/60'
                                        }`}
                                        aria-label={`Ir al paso ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
	);
};

export default Steps;
