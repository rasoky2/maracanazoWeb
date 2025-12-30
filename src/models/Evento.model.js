// Modelo para eventos
export class Evento {
  constructor(data = {}) {
    this.id = data.id || '';
    this.idCancha = data.idCancha || '';
    this.nombre = data.nombre || '';
    this.descripcion = data.descripcion || '';
    this.fecha = data.fecha || '';
    this.horaInicio = data.horaInicio || '';
    this.horaFin = data.horaFin || '';
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = data.fechaCreacion || new Date();
    this.fechaActualizacion = data.fechaActualizacion || new Date();
  }

  toFirestore() {
    return {
      idCancha: this.idCancha,
      nombre: this.nombre,
      descripcion: this.descripcion,
      fecha: this.fecha,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      activo: this.activo,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Evento({
      id: doc.id,
      ...data
    });
  }
}
