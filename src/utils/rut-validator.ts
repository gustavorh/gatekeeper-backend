export class RutValidator {
  /**
   * Valida el formato del RUT chileno
   * @param rut RUT en formato XX.XXX.XXX-X
   * @returns true si el formato es válido
   */
  static isValidFormat(rut: string): boolean {
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1}$/;
    return rutRegex.test(rut);
  }

  /**
   * Valida que el dígito verificador del RUT sea correcto
   * @param rut RUT en formato XX.XXX.XXX-X
   * @returns true si el dígito verificador es válido
   */
  static isValidChecksum(rut: string): boolean {
    // Remover puntos y guión
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');

    // Separar número y dígito verificador
    const number = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;

    for (let i = number.length - 1; i >= 0; i--) {
      sum += parseInt(number[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    let calculatedDv: string;

    if (expectedDv === 11) {
      calculatedDv = '0';
    } else if (expectedDv === 10) {
      calculatedDv = 'K';
    } else {
      calculatedDv = expectedDv.toString();
    }

    return calculatedDv === dv;
  }

  /**
   * Valida que el RUT sea válido (formato y dígito verificador)
   * @param rut RUT en formato XX.XXX.XXX-X
   * @returns true si el RUT es válido
   */
  static isValid(rut: string): boolean {
    return this.isValidFormat(rut) && this.isValidChecksum(rut);
  }

  /**
   * Formatea un RUT sin formato a formato XX.XXX.XXX-X
   * @param rut RUT sin formato (ej: 123456789)
   * @returns RUT formateado
   */
  static format(rut: string): string {
    // Remover caracteres no numéricos excepto el último
    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    const number = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Formatear número
    const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formattedNumber}-${dv}`;
  }
}
