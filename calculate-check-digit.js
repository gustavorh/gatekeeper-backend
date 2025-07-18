/**
 * Script para calcular el dígito verificador de un RUT
 */

function calculateCheckDigit(rutNumber) {
  // Calcular el dígito verificador esperado
  let sum = 0;
  let multiplier = 2;

  // Multiplicar cada dígito de derecha a izquierda
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    console.log(
      `Dígito ${rutNumber[i]} x ${multiplier} = ${
        parseInt(rutNumber[i]) * multiplier
      }`
    );
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  console.log(`Suma total: ${sum}`);

  // Calcular el resto de la división por 11
  const remainder = sum % 11;
  console.log(`Resto de ${sum} / 11 = ${remainder}`);

  // Determinar el dígito verificador esperado
  let expectedCheckDigit;
  if (remainder === 0) {
    expectedCheckDigit = "0";
  } else if (remainder === 1) {
    expectedCheckDigit = "K";
  } else {
    expectedCheckDigit = (11 - remainder).toString();
  }

  console.log(`Dígito verificador calculado: ${expectedCheckDigit}`);
  return expectedCheckDigit;
}

// Casos de prueba para verificar
const testRuts = ["12345678", "22222222", "17951113", "11111111"];

console.log("🧮 Calculando dígitos verificadores...\n");

testRuts.forEach((rut) => {
  console.log(`\n📝 Calculando para RUT: ${rut}`);
  console.log("---".repeat(15));
  const checkDigit = calculateCheckDigit(rut);
  console.log(`✅ RUT completo: ${rut}-${checkDigit}`);
  console.log("=".repeat(45));
});
