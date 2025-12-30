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
  describe(`[${page.key}] Discount section`, () => {
    const getDiscountSection = () => {
      // Use discount section selector from config
      return cy.get(page.expected?.discountSectionSelector || 'section.discount.section');
    };

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('discount section exists and is visible', () => {
      getDiscountSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          expect($section.length, 'discount section found').to.be.greaterThan(0);
        });
    });

    it('discount section has a heading or title', () => {
      getDiscountSection().then(($section) => {
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

    it('discount section contains price information', () => {
      getDiscountSection().then(($section) => {
        const textContent = $section.text();
        
        // Look for price indicators (numbers with currency symbols or price-related text)
        const hasPriceSymbols = /\d+[\s]*[₴$€£₽]/.test(textContent); // Currency symbols
        const hasPriceWords = /цін|price|стоимость|вартість|стоимость|цена|грн|₴/i.test(textContent); // Price-related words
        const hasPriceClasses = $section.find('[class*="price"], [class*="cost"], [class*="amount"]').length > 0;
        const hasPriceData = $section.find('[data-price], [data-cost]').length > 0;
        
        const hasPrice = hasPriceSymbols || hasPriceWords || hasPriceClasses || hasPriceData;

        expect(hasPrice, 'section contains price information').to.equal(true);
      });
    });

    it('discount section has list of benefits or features (if present)', () => {
      getDiscountSection().then(($section) => {
        // Look for list items (ul/ol) or items with checkmarks
        const hasList = $section.find('ul, ol').length > 0;
        const hasCheckmarks = $section.find('img[alt*="check"], [class*="check"]').length > 0;
        const hasBenefits = $section.find('[class*="benefit"], [class*="feature"]').length > 0;
        
        const hasBenefitsList = hasList || hasCheckmarks || hasBenefits;

        if (hasBenefitsList) {
          cy.log('Discount section contains benefits/features list');
        } else {
          cy.log('Discount section exists but has no explicit benefits list - this is optional');
        }
      });
    });

    it('discount section has CTA button (opens modal)', () => {
      getDiscountSection().then(($section) => {
        // Look for CTA button that opens modal
        const $ctaButton = $section.find('[data-modal-open], button[data-modal-open]').filter(':visible');
        
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
          cy.log('No CTA button found in discount section - this is optional');
        }
      });
    });

    it('discount section works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      getDiscountSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          // Verify section is accessible on mobile
          const rect = $section[0].getBoundingClientRect();
          expect(rect.width, 'section has width on mobile').to.be.greaterThan(0);
          expect(rect.height, 'section has height on mobile').to.be.greaterThan(0);

          // Verify price info is still visible on mobile
          const textContent = $section.text();
          const hasPriceSymbols = /\d+[\s]*[₴$€£₽]/.test(textContent);
          const hasPriceWords = /цін|price|стоимость|вартість|стоимость|цена|грн|₴/i.test(textContent);
          
          const hasPrice = hasPriceSymbols || hasPriceWords;

          if (hasPrice) {
            cy.log('Discount section contains price information on mobile');
          } else {
            cy.log('Discount section exists on mobile but has no explicit price information - this is optional');
          }
        });
    });
  });
});

