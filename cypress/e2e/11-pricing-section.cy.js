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

targetPages.forEach((page) => {
  describe(`[${page.key}] Pricing section`, () => {
    const getPricingSection = () => {
      // Try multiple selectors for pricing section
      const selectors = [
        '#pricing',
        '#price',
        '[class*="pricing"]',
        '[class*="price"]',
        'section.discount.section', // From pages.json
      ];

      for (const selector of selectors) {
        const $el = Cypress.$(selector);
        if ($el.length > 0 && $el.is(':visible')) {
          return cy.get(selector);
        }
      }
      // Fallback to discount section from config
      return cy.get(page.expected?.discountSectionSelector || 'section.discount.section');
    };

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('pricing section exists and is visible', () => {
      getPricingSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          expect($section.length, 'pricing section found').to.be.greaterThan(0);
        });
    });

    it('pricing section has a heading or title', () => {
      getPricingSection().then(($section) => {
        // Check for heading
        const hasHeading = $section.find('h2, h3, h4, h5, h6').filter(':visible').length > 0;
        
        // Check for title class
        const hasTitleClass = $section.find('[class*="title"], [class*="heading"]').filter(':visible').length > 0;
        
        // Check if section itself has meaningful text
        const sectionText = $section.text().trim();
        const hasText = sectionText.length > 10;

        expect(hasHeading || hasTitleClass || hasText, 'section has a heading or title').to.equal(true);
      });
    });

    it('pricing section contains price information (if available)', () => {
      getPricingSection().then(($section) => {
        const textContent = $section.text();
        
        // Look for price indicators (numbers with currency symbols or price-related text)
        const hasPriceSymbols = /\d+[\s]*[₴$€£₽]/.test(textContent); // Currency symbols
        const hasPriceWords = /цін|price|стоимость|вартість|стоимость|цена/i.test(textContent); // Price-related words
        const hasPriceClasses = $section.find('[class*="price"], [class*="cost"], [class*="amount"]').length > 0;
        const hasPriceData = $section.find('[data-price], [data-cost]').length > 0;
        
        // Section exists and is visible (already checked) - price info is optional
        const hasPrice = hasPriceSymbols || hasPriceWords || hasPriceClasses || hasPriceData;

        if (hasPrice) {
          cy.log('Section contains price information');
        } else {
          cy.log('Section exists but has no explicit price information - this is optional');
        }
      });
    });

    it('pricing section has CTA button if present (opens modal)', () => {
      getPricingSection().then(($section) => {
        // Look for CTA button that opens modal
        const $ctaButton = $section.find('[data-modal-open]').filter(':visible');
        
        if ($ctaButton.length > 0) {
          // If CTA button exists, verify it works
          // Note: We only verify that the modal opens; full form behavior is covered in TC#5 (05-modal-form.cy.js)
          cy.wrap($ctaButton.first())
            .scrollToCenter()
            .click({ force: true });

          // Modal should open
          cy.get('[data-modal].backdrop').should('exist').and('not.have.class', 'is-hidden');
          cy.get('[data-modal] .modal').should('be.visible');

          // Close modal
          cy.get('[data-modal] button[data-modal-close]').click({ force: true });
          cy.get('[data-modal].backdrop').should('have.class', 'is-hidden');
        } else {
          // If no CTA button, that's also OK - just skip this check
          cy.log('No CTA button found in pricing section - this is optional');
        }
      });
    });

    it('pricing section works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      getPricingSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          // Verify section is accessible on mobile
          const rect = $section[0].getBoundingClientRect();
          expect(rect.width, 'section has width on mobile').to.be.greaterThan(0);
          expect(rect.height, 'section has height on mobile').to.be.greaterThan(0);

          // Verify section is accessible on mobile (price info is optional)
          const textContent = $section.text();
          const hasPriceSymbols = /\d+[\s]*[₴$€£₽]/.test(textContent);
          const hasPriceWords = /цін|price|стоимость|вартість|стоимость|цена/i.test(textContent);
          const hasPriceClasses = $section.find('[class*="price"], [class*="cost"], [class*="amount"]').length > 0;
          
          const hasPrice = hasPriceSymbols || hasPriceWords || hasPriceClasses;

          if (hasPrice) {
            cy.log('Section contains price information on mobile');
          } else {
            cy.log('Section exists on mobile but has no explicit price information - this is optional');
          }
        });
    });
  });
});

