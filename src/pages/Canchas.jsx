import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Spinner } from '@heroui/react';
import { CanchaRepository } from '../repositories/Cancha.repository.js';

const Canchas = () => {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canchaRepository = new CanchaRepository();

  useEffect(() => {
    loadCanchas();
  }, []);

  const loadCanchas = async () => {
    try {
      setLoading(true);
      const canchasData = await canchaRepository.getAll();
      setCanchas(canchasData);
    } catch (err) {
      console.info('Error loading canchas:', err.message);
      setError('Error al cargar las canchas');
      // Fallback: mostrar canchas por defecto
      setCanchas([
        { 
          id: '1', 
          nombre: 'Cancha Fútbol 1', 
          tipo: 'futbol', 
          imagen: '/images/futbol1.jpg', 
          descripcion: 'Cancha de fútbol profesional',
          precio: 60,
          activo: true
        },
        { 
          id: '2', 
          nombre: 'Cancha Fútbol 2', 
          tipo: 'futbol', 
          imagen: '/images/futbol2.jpg', 
          descripcion: 'Cancha de fútbol con césped sintético',
          precio: 50,
          activo: true
        },
        { 
          id: '3', 
          nombre: 'Cancha Vóley', 
          tipo: 'voley', 
          imagen: '/images/voley.jpg', 
          descripcion: 'Cancha de vóley profesional',
          precio: 40,
          activo: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700">
          <Spinner color="success" />
          <span>Cargando canchas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Canchas Disponibles</h1>
          <p className="text-lg text-gray-600">Selecciona la cancha que mejor se adapte a tus necesidades</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {canchas.map(cancha => (
            <Card key={cancha.id} className="h-full">
              <img 
                src={cancha.imagen || cancha.imagenPrincipal || '/images/futbol1.jpg'}
                alt={cancha.nombre}
                className="w-full h-[250px] object-cover"
              />
              <div className="p-4 flex flex-col h-full">
                <h3 className="text-xl font-semibold">{cancha.nombre}</h3>
                <div className="mt-2 text-sm text-gray-700">
                  <div className="mb-1"><strong>Tipo:</strong> {cancha.tipo}</div>
                  {cancha.tamano && <div className="mb-1"><strong>Tamaño:</strong> {cancha.tamano}</div>}
                  <div className="mb-1"><strong>Descripción:</strong> {cancha.descripcion}</div>
                  <div className="mb-3">
                    <strong>Precios:</strong>
                    {cancha.precios ? (
                      <div className="mt-1 text-sm">
                        <div>{cancha.precios.manana?.inicio || '07:00'}-{cancha.precios.manana?.fin || '17:00'}: S/ {cancha.precios.manana?.precio || 0}</div>
                        {cancha.precios.noche && (
                          <div>{cancha.precios.noche.inicio || '17:00'}-{cancha.precios.noche.fin || '00:00'}: S/ {cancha.precios.noche.precio || 0}</div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1">S/ {cancha.precio || 0} por hora</div>
                    )}
                  </div>
                </div>
                <div className="mt-auto">
                  <Link to={`/reserva/${cancha.id}`}>
                    <Button color="success" className="w-full text-white text-lg font-semibold">Reservar Cancha</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Canchas;
