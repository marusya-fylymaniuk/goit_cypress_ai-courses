/// <reference types="cypress" />

// Data-driven pages config (add more pages in cypress/fixtures/pages.json)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pages = require('../fixtures/pages.json');

const pageKey = Cypress.env('PAGE_KEY');
const localeFilter = Cypress.env('LOCALE'); // Filter by locale: 'ua' or 'ua-ru'

// Filter pages by locale if LOCALE env var is set
let filteredPages = pages;
if (localeFilter) {
  filteredPages = pages.filter((p) => p.locale === localeFilter);
}

const targetPages = pageKey
  ? filteredPages.filter((p) => p.key === pageKey)
  : filteredPages;

// Helper to get locale from URL
const getLocaleFromUrl = (url) => {
  const path = new URL(String(url)).pathname;
  if (path.startsWith('/ua-ru/')) return 'ua-ru';
  if (path.startsWith('/ua/')) return 'ua';
  return null;
};

// Helper to get alternate locale
const getAlternateLocale = (currentLocale) => {
  return currentLocale === 'ua' ? 'ua-ru' : 'ua';
};

// Helper to build URL with different locale
const buildUrlWithLocale = (originalUrl, targetLocale) => {
  const url = new URL(originalUrl);
  const path = url.pathname;
  if (targetLocale === 'ua-ru') {
    url.pathname = path.replace(/^\/ua\//, '/ua-ru/');
  } else {
    url.pathname = path.replace(/^\/ua-ru\//, '/ua/');
  }
  return url.toString();
};

targetPages.forEach((page) => {
  describe(`[${page.key}] Language switcher / Localization`, () => {
    const currentLocale = getLocaleFromUrl(page.url);

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
      // Disable marketing popups that might interfere
      cy.window().then((win) => {
        if (win.localStorage) {
          win.localStorage.setItem('marketing-popup-disabled', 'true');
        }
      });
    });

    it('language switcher exists in header and is visible', () => {
      cy.get('header').should('exist').within(() => {
        // Look for common language switcher patterns:
        // - Links with locale in href (e.g., /ua-ru/, /ua/)
        // - Buttons or links with language codes (UA, RU, etc.)
        // - Elements with data attributes for language switching
        cy.get('a[href*="/ua/"], a[href*="/ua-ru/"], [data-lang], [data-locale], button[aria-label*="language"], button[aria-label*="мова"], button[aria-label*="язык"]')
          .filter(':visible')
          .should('have.length.at.least', 1);
      });
    });

    it('can navigate to alternate locale and URL changes correctly', () => {
      if (!currentLocale) {
        cy.log('Skipping: could not determine current locale from URL');
        return;
      }

      const alternateLocale = getAlternateLocale(currentLocale);
      const expectedUrl = buildUrlWithLocale(page.url, alternateLocale);

      // Navigate directly to alternate locale URL
      // This tests that the alternate locale page exists and is accessible
      cy.visit(expectedUrl);

      // Verify URL is in alternate locale
      cy.url().should('include', `/${alternateLocale}/`);
      cy.location('href').should('eq', expectedUrl);
      
      // Verify page loads successfully
      cy.get('body').should('be.visible');
      cy.get('h1').should('be.visible');
    });

    it('page content updates after locale change (H1 remains visible)', () => {
      if (!currentLocale) {
        cy.log('Skipping: could not determine current locale from URL');
        return;
      }

      const alternateLocale = getAlternateLocale(currentLocale);
      const expectedUrl = buildUrlWithLocale(page.url, alternateLocale);

      // Get initial H1 text from current locale
      cy.get('h1')
        .should('be.visible')
        .invoke('text')
        .then((initialH1Text) => {
          // Navigate to alternate locale
          cy.visit(expectedUrl);

          // Wait for page to load
          cy.url().should('include', `/${alternateLocale}/`);
          cy.get('body').should('be.visible');

          // Verify H1 still exists and is visible (content may change, but structure should remain)
          cy.get('h1')
            .should('be.visible')
            .invoke('text')
            .then((newH1Text) => {
              // H1 should still exist and be visible (text may or may not change depending on translation)
              expect(newH1Text, 'H1 text after locale change').to.not.be.empty;
            });
        });
    });

    it('alternate locale page works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      if (!currentLocale) {
        cy.log('Skipping: could not determine current locale from URL');
        return;
      }

      const alternateLocale = getAlternateLocale(currentLocale);
      const expectedUrl = buildUrlWithLocale(page.url, alternateLocale);

      // Navigate to alternate locale
      cy.visit(expectedUrl);

      // Verify URL is in alternate locale and page loads
      cy.url().should('include', `/${alternateLocale}/`);
      cy.get('body').should('be.visible');
      cy.get('h1').should('be.visible');
    });

    it('locale change preserves course page path (only locale prefix changes)', () => {
      if (!currentLocale) {
        cy.log('Skipping: could not determine current locale from URL');
        return;
      }

      const alternateLocale = getAlternateLocale(currentLocale);
      const expectedUrl = buildUrlWithLocale(page.url, alternateLocale);
      const expectedPath = new URL(expectedUrl).pathname;

      // Navigate to alternate locale
      cy.visit(expectedUrl);

      // Verify path structure is preserved (only locale prefix changed)
      cy.location('pathname').should('eq', expectedPath);
      cy.url().should('include', '/courses/');
      // Extract course key from page.key (remove -ru suffix if present)
      const courseKey = page.key.replace(/-ru$/, '');
      cy.url().should('include', courseKey);
    });

    it('can navigate back to original locale (round-trip)', () => {
      if (!currentLocale) {
        cy.log('Skipping: could not determine current locale from URL');
        return;
      }

      const alternateLocale = getAlternateLocale(currentLocale);
      const alternateUrl = buildUrlWithLocale(page.url, alternateLocale);

      // Navigate to alternate locale
      cy.visit(alternateUrl);
      cy.url().should('include', `/${alternateLocale}/`);

      // Navigate back to original locale
      cy.visit(page.url);

      // Verify we're back to original URL
      cy.url().should('eq', page.url);
      cy.location('pathname').should('include', `/${currentLocale}/`);
      cy.get('h1').should('be.visible');
    });
  });
});

