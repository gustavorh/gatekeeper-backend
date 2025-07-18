/**
 * Script de prueba para validar la función de validación del RUT chileno
 */

function validateRutDigit(rut) {
  try {
    // Limpiar el RUT: remover puntos, espacios y convertir a mayúsculas
    const cleanRut = rut.replace(/[\s.-]/g, "").toUpperCase();

    // Validar formato básico (al menos 2 caracteres)
    if (cleanRut.length < 2) {
      return false;
    }

    // Separar el número del dígito verificador
    const rutNumber = cleanRut.slice(0, -1);
    const checkDigit = cleanRut.slice(-1);

    // Validar que la parte numérica solo contenga dígitos
    if (!/^\d+$/.test(rutNumber)) {
      return false;
    }

    // Validar que el dígito verificador sea válido (0-9 o K)
    if (!/^[0-9K]$/.test(checkDigit)) {
      return false;
    }

    // Calcular el dígito verificador esperado
    let sum = 0;
    let multiplier = 2;

    // Multiplicar cada dígito de derecha a izquierda
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      sum += parseInt(rutNumber[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    // Calcular el resto de la división por 11
    const remainder = sum % 11;

    // Determinar el dígito verificador esperado
    let expectedCheckDigit;
    if (remainder === 0) {
      expectedCheckDigit = "0";
    } else if (remainder === 1) {
      expectedCheckDigit = "K";
    } else {
      expectedCheckDigit = (11 - remainder).toString();
    }

    // Comparar con el dígito verificador proporcionado
    return checkDigit === expectedCheckDigit;
  } catch (error) {
    return false;
  }
}

// Casos de prueba
const testCases = [
  // RUTs válidos (calculados correctamente)
  { rut: "12345678-5", expected: true, description: "RUT válido con guión" },
  {
    rut: "12.345.678-5",
    expected: true,
    description: "RUT válido con puntos y guión",
  },
  { rut: "123456785", expected: true, description: "RUT válido sin formato" },
  {
    rut: "11111111-1",
    expected: true,
    description: "RUT válido con dígito verificador 1",
  },
  {
    rut: "22222222-2",
    expected: true,
    description: "RUT válido con dígito verificador 2",
  },
  {
    rut: "17951113-4",
    expected: true,
    description: "RUT válido con dígito verificador 4",
  },
  // Casos válidos con dígito verificador 0 y K
  {
    rut: "10000004-0",
    expected: true,
    description: "RUT válido con dígito verificador 0",
  },
  {
    rut: "10000013-K",
    expected: true,
    description: "RUT válido con dígito verificador K",
  },

  // RUTs inválidos
  {
    rut: "12345678-6",
    expected: false,
    description: "RUT inválido - dígito verificador incorrecto",
  },
  {
    rut: "12345678-X",
    expected: false,
    description: "RUT inválido - dígito verificador no válido",
  },
  { rut: "1234567", expected: false, description: "RUT inválido - muy corto" },
  {
    rut: "abcdefgh-5",
    expected: false,
    description: "RUT inválido - contiene letras",
  },
  { rut: "", expected: false, description: "RUT vacío" },
  {
    rut: "12345678-",
    expected: false,
    description: "RUT sin dígito verificador",
  },
  {
    rut: "22222222-K",
    expected: false,
    description: "RUT inválido - dígito verificador incorrecto (debería ser 2)",
  },
  {
    rut: "17951113-0",
    expected: false,
    description: "RUT inválido - dígito verificador incorrecto (debería ser 4)",
  },
  {
    rut: "12345670-0",
    expected: false,
    description: "RUT inválido - dígito verificador incorrecto (debería ser K)",
  },
  {
    rut: "12345679-K",
    expected: false,
    description: "RUT inválido - dígito verificador incorrecto (debería ser 3)",
  },
];

console.log("🧪 Ejecutando pruebas de validación de RUT...\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateRutDigit(testCase.rut);
  const isCorrect = result === testCase.expected;

  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  RUT: ${testCase.rut}`);
  console.log(`  Esperado: ${testCase.expected}, Obtenido: ${result}`);
  console.log(`  ${isCorrect ? "✅ PASÓ" : "❌ FALLÓ"}\n`);

  if (isCorrect) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n📊 Resultados:`);
console.log(`  ✅ Pruebas pasadas: ${passed}`);
console.log(`  ❌ Pruebas fallidas: ${failed}`);
console.log(
  `  📈 Porcentaje de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`
);

if (failed === 0) {
  console.log(
    "\n🎉 ¡Todas las pruebas pasaron! La validación del RUT funciona correctamente."
  );
} else {
  console.log("\n⚠️  Algunas pruebas fallaron. Revisa la implementación.");
}
