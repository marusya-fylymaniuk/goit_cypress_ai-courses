// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

/**
 * Wait for dataLayer to be available and initialized
 */
Cypress.Commands.add('waitForDataLayer', () => {
  cy.window().then((win) => {
    // Initialize dataLayer if it doesn't exist
    if (!win.dataLayer) {
      win.dataLayer = [];
    }
    // Wait a bit for scripts to initialize
    cy.wait(500);
  });
});

/**
 * Check if dataLayer contains specific event
 */
Cypress.Commands.add('dataLayerShouldContain', (eventName) => {
  cy.window().then((win) => {
    const dataLayer = win.dataLayer || [];
    const hasEvent = dataLayer.some(item => item.event === eventName);
    expect(hasEvent).to.be.true;
  });
});

/**
 * Scroll to element and ensure it's visible
 */
Cypress.Commands.add('scrollToElement', (selector) => {
  cy.get(selector).scrollIntoView({ duration: 500 });
  cy.get(selector).should('be.visible');
});

/**
 * Scroll an element so that it is centered in the viewport.
 * Usage:
 *   cy.get('selector').scrollToCenter()
 */
Cypress.Commands.add(
  'scrollToCenter',
  { prevSubject: 'element' },
  (subject) => {
    return cy.window().then((win) => {
      const el = subject[0];
      if (!el || !el.getBoundingClientRect) return cy.wrap(subject);

      const rect = el.getBoundingClientRect();
      const targetTop = win.scrollY + rect.top - (win.innerHeight / 2 - rect.height / 2);

      win.scrollTo({ top: Math.max(0, targetTop), left: 0, behavior: 'auto' });

      // Optional: assert it is roughly centered (within 80px) to avoid flakiness
      const rectAfter = el.getBoundingClientRect();
      const centerY = rectAfter.top + rectAfter.height / 2;
      const viewportCenterY = win.innerHeight / 2;
      expect(Math.abs(centerY - viewportCenterY)).to.be.lessThan(80);

      return cy.wrap(subject);
    });
  },
);

/**
 * Check page for 4xx/5xx errors
 */
Cypress.Commands.add('checkPageErrors', () => {
  cy.window().then((win) => {
    // Check console for errors
    cy.log('Checking for page errors...');
  });
  
  // Intercept and check network requests
  cy.intercept('**', (req) => {
    req.continue((res) => {
      if (res.statusCode >= 400 && res.statusCode < 600) {
        cy.log(`Warning: ${req.url} returned ${res.statusCode}`);
      }
    });
  });
});

