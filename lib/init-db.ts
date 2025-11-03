import { initDatabase } from "./db";

// Script d'initialisation de la base de données
// Peut être exécuté manuellement ou au démarrage de l'app
if (require.main === module) {
  initDatabase();
  console.log("✓ Base de données initialisée");
}

export { initDatabase };
