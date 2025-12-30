const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Base URL is intentionally NOT fixed to a single landing.
    // We test multiple similar pages using a pages config file (see cypress/fixtures/pages.json).
    // Tests will call cy.visit(page.url) explicitly.
    baseUrl: "https://goit.global/",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    chromeWebSecurity: false,
    userAgent: "MyCypressTestBrowser/1.0", // Your custom User-Agent string for browser requests
  },
});
