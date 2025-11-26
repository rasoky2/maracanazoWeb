// Modelo para descuentos y promociones
export class Descuento {
  constructor(data = {}) {
    this.id = data.id || '';
    this.codigo = data.codigo || ''; // Código promocional (ej: "VERANO2024")
    this.nombre = data.nombre || ''; // Nombre descriptivo del descuento
    this.tipo = data.tipo || 'porcentaje'; // 'porcentaje' | 'monto_fijo'
    this.valor = data.valor || 0; // Porcentaje (0-100) o monto fijo en soles
    this.montoMinimo = data.montoMinimo || 0; // Monto mínimo de compra para aplicar
    this.montoMaximo = data.montoMaximo || null; // Descuento máximo (solo para porcentaje)
    this.fechaInicio = data.fechaInicio || null; // Fecha de inicio (Date o string)
    this.fechaFin = data.fechaFin || null; // Fecha de fin (Date o string)
    this.horaInicio = data.horaInicio || null; // Hora de inicio (ej: "07:00")
    this.horaFin = data.horaFin || null; // Hora de fin (ej: "17:00")
    this.diasSemana = data.diasSemana || null; // Array de días [0-6] o null para todos
    this.canchaIds = data.canchaIds || null; // Array de IDs de canchas específicas o null para todas
    this.tiposCancha = data.tiposCancha || null; // Array de tipos ['futbol', 'voley'] o null
    this.usosMaximos = data.usosMaximos || null; // Número máximo de usos totales
    this.usosPorUsuario = data.usosPorUsuario || 1; // Usos máximos por usuario
    this.usosActuales = data.usosActuales || 0; // Contador de usos actuales
    this.activo = data.activo === undefined ? true : data.activo;
    this.esPublico = data.esPublico === undefined ? true : data.esPublico; // Si es público o requiere código
    this.descripcion = data.descripcion || '';
    this.fechaCreacion = data.fechaCreacion || new Date();
    this.fechaActualizacion = data.fechaActualizacion || new Date();
  }

  // Validar si el descuento es aplicable en este momento
  esValido(fecha = new Date(), hora = null) {
    if (!this.activo) return false;

    const ahora = fecha instanceof Date ? fecha : new Date(fecha);
    const fechaActual = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    // Validar fechas
    if (this.fechaInicio) {
      const inicio = this.fechaInicio instanceof Date 
        ? new Date(this.fechaInicio.getFullYear(), this.fechaInicio.getMonth(), this.fechaInicio.getDate())
        : new Date(this.fechaInicio);
      if (fechaActual < inicio) return false;
    }

    if (this.fechaFin) {
      const fin = this.fechaFin instanceof Date
        ? new Date(this.fechaFin.getFullYear(), this.fechaFin.getMonth(), this.fechaFin.getDate())
        : new Date(this.fechaFin);
      if (fechaActual > fin) return false;
    }

    // Validar hora
    if (hora && this.horaInicio && this.horaFin) {
      const [horaActual] = hora.split(':').map(Number);
      const [horaInicio] = this.horaInicio.split(':').map(Number);
      const [horaFin] = this.horaFin.split(':').map(Number);
      
      if (horaFin === 0) {
        if (horaActual < horaInicio) return false;
      } else {
        if (horaActual < horaInicio || horaActual >= horaFin) return false;
      }
    }

    // Validar día de la semana
    if (this.diasSemana && Array.isArray(this.diasSemana) && this.diasSemana.length > 0) {
      const diaSemana = ahora.getDay();
      if (!this.diasSemana.includes(diaSemana)) return false;
    }

    // Validar usos máximos
    if (this.usosMaximos !== null && this.usosActuales >= this.usosMaximos) {
      return false;
    }

    return true;
  }

  // Validar si aplica para una cancha específica
  aplicaParaCancha(canchaId, tipoCancha) {
    if (this.canchaIds && Array.isArray(this.canchaIds) && this.canchaIds.length > 0) {
      if (!this.canchaIds.includes(canchaId)) return false;
    }

    if (this.tiposCancha && Array.isArray(this.tiposCancha) && this.tiposCancha.length > 0) {
      if (!this.tiposCancha.includes(tipoCancha)) return false;
    }

    return true;
  }

  // Calcular el descuento aplicado
  calcularDescuento(montoBase) {
    if (montoBase < this.montoMinimo) {
      return { descuento: 0, montoFinal: montoBase, aplicado: false };
    }

    let descuento = 0;

    if (this.tipo === 'porcentaje') {
      descuento = (montoBase * this.valor) / 100;
      if (this.montoMaximo !== null && descuento > this.montoMaximo) {
        descuento = this.montoMaximo;
      }
    } else if (this.tipo === 'monto_fijo') {
      descuento = this.valor;
      if (descuento > montoBase) {
        descuento = montoBase;
      }
    }

    const montoFinal = Math.max(0, montoBase - descuento);

    return {
      descuento: Math.round(descuento * 100) / 100,
      montoFinal: Math.round(montoFinal * 100) / 100,
      aplicado: true
    };
  }

  toFirestore() {
    return {
      codigo: this.codigo,
      nombre: this.nombre,
      tipo: this.tipo,
      valor: this.valor,
      montoMinimo: this.montoMinimo,
      montoMaximo: this.montoMaximo,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      diasSemana: this.diasSemana,
      canchaIds: this.canchaIds,
      tiposCancha: this.tiposCancha,
      usosMaximos: this.usosMaximos,
      usosPorUsuario: this.usosPorUsuario,
      usosActuales: this.usosActuales,
      activo: this.activo,
      esPublico: this.esPublico,
      descripcion: this.descripcion,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Descuento({
      id: doc.id,
      ...data
    });
  }
}

