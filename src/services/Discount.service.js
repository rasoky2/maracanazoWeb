import { DescuentoRepository } from '../repositories/Descuento.repository.js';

export class DiscountService {
  constructor() {
    this.descuentoRepository = new DescuentoRepository();
  }

  // Validar y obtener descuento por código
  async validarCodigo(codigo, montoBase, canchaId, tipoCancha, fecha, hora) {
    try {
      if (!codigo || codigo.trim() === '') {
        return { valido: false, error: 'Código requerido' };
      }

      const descuento = await this.descuentoRepository.getByCodigo(codigo.trim().toUpperCase());
      
      if (!descuento) {
        return { valido: false, error: 'Código promocional no válido' };
      }

      // Validar si es válido en este momento
      if (!descuento.esValido(fecha, hora)) {
        return { valido: false, error: 'El código promocional no está vigente en este momento' };
      }

      // Validar si aplica para esta cancha
      if (!descuento.aplicaParaCancha(canchaId, tipoCancha)) {
        return { valido: false, error: 'Este código no aplica para esta cancha' };
      }

      // Validar monto mínimo
      if (montoBase < descuento.montoMinimo) {
        return { 
          valido: false, 
          error: `El monto mínimo para aplicar este descuento es S/ ${descuento.montoMinimo}` 
        };
      }

      // Calcular descuento
      const calculo = descuento.calcularDescuento(montoBase);

      return {
        valido: true,
        descuento,
        calculo,
        mensaje: `Descuento aplicado: ${descuento.nombre}`
      };
    } catch (error) {
      console.info('Error validating discount code:', error);
      return { valido: false, error: 'Error al validar el código promocional' };
    }
  }

  // Obtener descuentos públicos aplicables
  async obtenerDescuentosAplicables(canchaId, tipoCancha, fecha, hora) {
    try {
      const descuentosPublicos = await this.descuentoRepository.getPublicosActivos();
      
      return descuentosPublicos.filter(descuento => {
        return descuento.esValido(fecha, hora) && 
               descuento.aplicaParaCancha(canchaId, tipoCancha);
      });
    } catch (error) {
      console.info('Error getting applicable discounts:', error);
      return [];
    }
  }

  // Aplicar descuento a una reserva
  async aplicarDescuento(codigo, montoBase, canchaId, tipoCancha, fecha, hora) {
    const validacion = await this.validarCodigo(codigo, montoBase, canchaId, tipoCancha, fecha, hora);
    
    if (!validacion.valido) {
      return validacion;
    }

    // Incrementar contador de usos
    try {
      await this.descuentoRepository.incrementarUso(validacion.descuento.id);
    } catch (error) {
      console.info('Error incrementing discount usage:', error);
    }

    return validacion;
  }
}
