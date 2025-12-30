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
  describe(`[${page.key}] Benefits section (#benefits)`, () => {
    const getBenefitsSection = () => cy.get('#benefits');

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('benefits section exists and is visible', () => {
      getBenefitsSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          // Verify it's actually a section element or has section-like structure
          expect($section.length, 'benefits section found').to.be.greaterThan(0);
        });
    });

    it('benefits section has a heading (H2 or H3)', () => {
      getBenefitsSection().within(() => {
        cy.get('h2, h3')
          .filter(':visible')
          .should('have.length.at.least', 1)
          .first()
          .then(($heading) => {
            const headingText = $heading.text().trim();
            expect(headingText, 'heading is not empty').to.not.be.empty;
            expect(headingText.length, 'heading has meaningful length').to.be.greaterThan(3);
          });
      });
    });

    it('benefits section contains benefit items (minimum 3)', () => {
      getBenefitsSection().then(($section) => {
        // Try multiple selectors to find benefit items
        const selectors = [
          '.benefit-card',
          '.benefit-item',
          '[class*="benefit"]:not(#benefits)',
          'article',
          'li',
          '.card',
          '[class*="card"]',
        ];

        let foundItems = 0;
        let foundSelector = null;

        // Try each selector
        for (const selector of selectors) {
          const $items = $section.find(selector).filter(':visible');
          if ($items.length >= 3) {
            foundItems = $items.length;
            foundSelector = selector;
            break;
          }
        }

        // If still not found, look for direct children
        if (foundItems < 3) {
          const $children = $section.children().filter(':visible');
          if ($children.length >= 3) {
            foundItems = $children.length;
            foundSelector = 'direct children';
          }
        }

        expect(foundItems, `at least 3 benefit items found (using selector: ${foundSelector || 'none'})`).to.be.at.least(3);
      });
    });

    it('each benefit item has a title/heading', () => {
      getBenefitsSection().then(($section) => {
        // Find benefit items using flexible selectors
        const itemSelectors = [
          '.benefit-card',
          '.benefit-item',
          '[class*="benefit"]:not(#benefits)',
          'article',
          'li',
        ];

        let $items = Cypress.$();
        for (const selector of itemSelectors) {
          $items = $section.find(selector).filter(':visible');
          if ($items.length >= 3) break;
        }

        // If not found by specific selectors, use direct children
        if ($items.length < 3) {
          $items = $section.children().filter(':visible');
        }

        expect($items.length, 'benefit items found').to.be.at.least(3);

        // Check each item has a heading
        $items.each((index, item) => {
          const $item = Cypress.$(item);
          const hasHeading =
            $item.find('h2, h3, h4, h5, h6').filter(':visible').length > 0 ||
            $item.find('[class*="title"], [class*="heading"]').filter(':visible').length > 0 ||
            $item.find('strong, b').filter(':visible').length > 0;

          expect(hasHeading, `benefit item ${index + 1} has a title/heading`).to.equal(true);
        });
      });
    });

    it('each benefit item has a description', () => {
      getBenefitsSection().then(($section) => {
        // Find benefit items
        const itemSelectors = [
          '.benefit-card',
          '.benefit-item',
          '[class*="benefit"]:not(#benefits)',
          'article',
          'li',
        ];

        let $items = Cypress.$();
        for (const selector of itemSelectors) {
          $items = $section.find(selector).filter(':visible');
          if ($items.length >= 3) break;
        }

        if ($items.length < 3) {
          $items = $section.children().filter(':visible');
        }

        expect($items.length, 'benefit items found').to.be.at.least(3);

        // Check each item has description text
        $items.each((index, item) => {
          const $item = Cypress.$(item);
          // Get all text, exclude heading text
          const headingText = $item.find('h2, h3, h4, h5, h6, [class*="title"], [class*="heading"]').text();
          const allText = $item.text().trim();
          const descriptionText = allText.replace(headingText, '').trim();

          expect(descriptionText.length, `benefit item ${index + 1} has description (at least 10 chars)`).to.be.at.least(10);
        });
      });
    });

    it('benefits section works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      getBenefitsSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          // Verify section is accessible on mobile
          const rect = $section[0].getBoundingClientRect();
          expect(rect.width, 'section has width on mobile').to.be.greaterThan(0);
          expect(rect.height, 'section has height on mobile').to.be.greaterThan(0);
        });

      // Verify benefit items are visible on mobile
      getBenefitsSection().then(($section) => {
        const itemSelectors = [
          '.benefit-card',
          '.benefit-item',
          '[class*="benefit"]:not(#benefits)',
          'article',
          'li',
        ];

        let $items = Cypress.$();
        for (const selector of itemSelectors) {
          $items = $section.find(selector).filter(':visible');
          if ($items.length >= 3) break;
        }

        if ($items.length < 3) {
          $items = $section.children().filter(':visible');
        }

        expect($items.length, 'at least 3 benefit items visible on mobile').to.be.at.least(3);
      });
    });
  });
});

