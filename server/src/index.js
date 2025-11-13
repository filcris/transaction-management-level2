// src/index.js
import { app, defaultAccountId } from './app.js';

// PORT configurável via variável de ambiente (default 4000)
const PORT = process.env.PORT || 4000;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`✅ API listening on http://localhost:${PORT}`);
  console.log(`🌱 Seed account: ${defaultAccountId}`);
});

// Export para testes automáticos (node:test + supertest)
export default server;
