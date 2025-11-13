// web/cypress.config.js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    env: { apiUrl: "http://localhost:4000" },
    supportFile: false,
    specPattern: "cypress/e2e/**/*.cy.js",
    defaultCommandTimeout: 10000,   // 👈 dá até 10s para encontrar o elemento
  },
});
