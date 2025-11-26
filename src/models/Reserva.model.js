// Modelo para reservas
export class Reserva {
  constructor(data = {}) {
    this.id = data.id || '';
    this.idUsuario = data.idUsuario || '';
    this.idCancha = data.idCancha || '';
    this.fecha = data.fecha || '';
    this.horaInicio = data.horaInicio || '';
    this.horaFin = data.horaFin || '';
    this.precioTotal = data.precioTotal || 0;
    this.subtotal = data.subtotal || data.precioTotal || 0;
    this.idDescuento = data.idDescuento || null;
    this.codigoDescuento = data.codigoDescuento || null;
    this.montoDescuento = data.montoDescuento || 0;
    this.estadoPago = data.estadoPago || 'pendiente';
    this.metodoPago = data.metodoPago || '';
    this.notas = data.notas || '';
    this.fechaCreacion = data.fechaCreacion || new Date();
    this.fechaActualizacion = data.fechaActualizacion || new Date();
  }

  toFirestore() {
    return {
      idUsuario: this.idUsuario,
      idCancha: this.idCancha,
      fecha: this.fecha,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      precioTotal: this.precioTotal,
      subtotal: this.subtotal,
      idDescuento: this.idDescuento,
      codigoDescuento: this.codigoDescuento,
      montoDescuento: this.montoDescuento,
      estadoPago: this.estadoPago,
      metodoPago: this.metodoPago,
      notas: this.notas,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Reserva({
      id: doc.id,
      ...data
    });
  }
}
