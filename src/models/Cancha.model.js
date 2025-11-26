// Modelo para canchas deportivas
export class Cancha {
  constructor(data = {}) {
    this.id = data.id || '';
    this.nombre = data.nombre || '';
    this.tipo = data.tipo || '';
    this.tamano = data.tamano || '';
    this.descripcion = data.descripcion || '';
    this.precio = data.precio || 0;
    this.precios = data.precios || {
      manana: { inicio: '07:00', fin: '17:00', precio: 0 },
      noche: { inicio: '17:00', fin: '00:00', precio: 0 }
    };
    this.preciosSemanales = data.preciosSemanales || null;
    this.imagen = data.imagen || '';
    this.imagenPrincipal = data.imagenPrincipal || data.imagen || '';
    this.imagenTarjeta = data.imagenTarjeta || '';
    this.imagen1 = data.imagen1 || '';
    this.imagen2 = data.imagen2 || '';
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = data.fechaCreacion || new Date();
    this.fechaActualizacion = data.fechaActualizacion || new Date();
  }

  getPriceByTime(time, dayOfWeek = null) {
    const precios = this.getPricingForDay(dayOfWeek);
    
    if (!precios) {
      return this.precio || 0;
    }
    
    const [hourStr, minuteStr] = time.split(':');
    const hour = Number.parseInt(hourStr, 10);
    const minute = Number.parseInt(minuteStr, 10);
    const timeMinutes = hour * 60 + minute;
    
    const manana = precios.manana;
    const noche = precios.noche;
    
    const [morningStartHour, morningStartMin] = (manana?.inicio || '07:00').split(':');
    const morningStart = Number.parseInt(morningStartHour, 10) * 60 + Number.parseInt(morningStartMin, 10);
    
    const [morningEndHour, morningEndMin] = (manana?.fin || '17:00').split(':');
    let morningEnd = Number.parseInt(morningEndHour, 10) * 60 + Number.parseInt(morningEndMin, 10);
    
    if (morningEnd === 0) {
      morningEnd = 24 * 60;
    }
    
    if (timeMinutes >= morningStart && timeMinutes < morningEnd) {
      return manana?.precio || 0;
    }
    
    return noche?.precio || manana?.precio || 0;
  }

  getPricingForDay(dayOfWeek) {
    if (!dayOfWeek || !this.preciosSemanales) {
      return this.precios;
    }
    
    const dayKey = dayOfWeek.toLowerCase();
    const dayPricing = this.preciosSemanales[dayKey];
    
    return dayPricing || this.precios;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      tipo: this.tipo,
      tamano: this.tamano,
      descripcion: this.descripcion,
      precio: this.precio,
      precios: this.precios,
      preciosSemanales: this.preciosSemanales,
      imagen: this.imagen || this.imagenPrincipal,
      imagenPrincipal: this.imagenPrincipal || this.imagen,
      imagenTarjeta: this.imagenTarjeta,
      imagen1: this.imagen1,
      imagen2: this.imagen2,
      activo: this.activo,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Cancha({
      id: doc.id,
      ...data
    });
  }
}
