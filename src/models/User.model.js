// Modelo base para usuarios
export class User {
  constructor(data = {}) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.nombreCompleto = data.nombreCompleto || data.nombre || '';
    this.telefono = data.telefono || '';
    this.urlFoto = data.urlFoto || '';
    this.esAdmin = data.esAdmin || false;
    this.fechaCreacion = data.fechaCreacion || new Date();
    this.fechaActualizacion = data.fechaActualizacion || new Date();
  }

  toFirestore() {
    return {
      email: this.email,
      nombreCompleto: this.nombreCompleto,
      telefono: this.telefono,
      urlFoto: this.urlFoto,
      esAdmin: this.esAdmin,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      id: doc.id,
      ...data
    });
  }

  getDisplayName() {
    return this.nombreCompleto || 'Usuario';
  }

  getProfilePhoto() {
    return this.urlFoto || '';
  }
}
