import { initializeRBAC } from "../lib/rbac-init";

async function main() {
  console.log("🚀 Iniciando configuración del sistema RBAC...\n");

  try {
    const result = await initializeRBAC();

    if (result.success) {
      console.log("✅ Sistema RBAC inicializado exitosamente!");
      console.log("\n📝 Pasos siguientes:");
      console.log("1. Crear un usuario administrador en la base de datos");
      console.log("2. Asignar el rol 'admin' al usuario administrador");
      console.log(
        "3. Usar el endpoint /api/admin/rbac/init para futuras inicializaciones"
      );

      console.log("\n🔧 Para crear un admin manualmente:");
      console.log(
        "UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE user_id = [ID_DEL_USUARIO];"
      );

      process.exit(0);
    } else {
      console.error("❌ Error inicializando el sistema RBAC:");
      console.error(result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  }
}

main();
