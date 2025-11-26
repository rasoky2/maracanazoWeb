import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaInstagram,
  FaTiktok,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock
} from 'react-icons/fa';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-10 mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h5 className="fw-bold mb-3">Maracanazo</h5>
            <p className="text-light">
              Web dedicada a reservas en tiempo real.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white no-underline flex items-center justify-center rounded-full social-icon"
                style={{ width: '45px', height: '45px', backgroundColor: '#E4405F' }}
                title="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white no-underline flex items-center justify-center rounded-full social-icon"
                style={{ width: '45px', height: '45px', backgroundColor: '#000000' }}
                title="TikTok"
              >
                <FaTiktok size={20} />
              </a>
            </div>
          </div>

          <div className="md:col-span-1">
            <h6 className="fw-bold mb-3">Enlaces Rápidos</h6>
            <ul className="list-none">
              <li className="mb-2">
                <Link to="/" className="text-light no-underline">Inicio</Link>
              </li>
              <li className="mb-2">
                <Link to="/canchas" className="text-light no-underline">Canchas</Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-light no-underline">Contacto</Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h6 className="fw-bold mb-3">Servicios</h6>
            <ul className="list-none">
              <li className="mb-2">
                <Link to="/reserva" className="text-light no-underline">Reservas</Link>
              </li>
              <li className="mb-2">
                <Link to="/canchas" className="text-light no-underline">Canchas</Link>
              </li>
              <li className="mb-2">
                <span className="text-light">Torneos</span>
              </li>
              <li className="mb-2">
                <span className="text-light">Entrenamientos</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h6 className="fw-bold mb-3">Contacto</h6>
            <div className="flex items-center mb-3">
              <div className="bg-success rounded-full flex items-center justify-center mr-3" 
                   style={{ width: '40px', height: '40px' }}>
                <FaMapMarkerAlt size={20} className="text-white" />
              </div>
              <span className="text-light">urb. las joyas S/N, Puerto Maldonado, Peru</span>
            </div>
            <div className="flex items-center mb-3">
              <div className="bg-success rounded-full flex items-center justify-center mr-3" 
                   style={{ width: '40px', height: '40px' }}>
                <FaPhone size={20} className="text-white" />
              </div>
              <span className="text-light">+51 999 888 777</span>
            </div>
            <div className="flex items-center mb-3">
              <div className="bg-success rounded-full flex items-center justify-center mr-3" 
                   style={{ width: '40px', height: '40px' }}>
                <FaEnvelope size={20} className="text-white" />
              </div>
              <span className="text-light">info@maracanazo.com</span>
            </div>
            <div className="flex items-center mb-3">
              <div className="bg-success rounded-full flex items-center justify-center mr-3" 
                   style={{ width: '40px', height: '40px' }}>
                <FaClock size={20} className="text-white" />
              </div>
              <span className="text-light">Lun-Dom: 6:00 AM - 10:00 PM</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 grid grid-cols-1 md:grid-cols-2 items-center">
          <p className="text-light mb-0 text-sm">
            © 2024 Maracanazo. Todos los derechos reservados.
          </p>
          <div className="mt-4 md:mt-0 md:text-right flex md:justify-end gap-3">
            <Link to="/privacy" className="text-light no-underline text-sm">
              Política de Privacidad
            </Link>
            <Link to="/terms" className="text-light no-underline text-sm">
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
