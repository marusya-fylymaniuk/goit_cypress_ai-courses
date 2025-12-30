// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Disable marketing/exit-intent popups that can appear during automated runs.
// This keeps unrelated popups from covering the UI (e.g., #popup-test quiz popup).
Cypress.on('window:before:load', (win) => {
  try {
    const inject = () => {
      const doc = win.document;
      if (!doc || doc.getElementById('__cypress-disable-popups-style')) return;
      const style = doc.createElement('style');
      style.id = '__cypress-disable-popups-style';
      style.textContent = `
        #popup-test { display: none !important; visibility: hidden !important; }
        /* Fixed marketing banner at the top can intercept clicks in Electron/headed runs */
        a.banner__top, a.banner__top *:not(input):not(textarea):not(select) { pointer-events: none !important; }
      `;
      (doc.head || doc.documentElement).appendChild(style);
    };

    win.document.addEventListener('DOMContentLoaded', inject, { once: true });
    inject();
  } catch {
    // ignore
  }
});

// Prevent Cypress from failing on uncaught exceptions from the app
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // on uncaught exceptions (useful for third-party scripts)
  if (err.message.includes('ResizeObserver') || 
      err.message.includes('Non-Error promise rejection') ||
      err.message.includes('dataLayer is not defined')) {
    return false;
  }
  return true;
});

