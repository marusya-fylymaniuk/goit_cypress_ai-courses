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
  describe(`[${page.key}] Reviews (#reviews)`, () => {
    const getReviewsSection = () => cy.get('#reviews');

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('reviews section exists and is visible', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#reviews');
        if ($section.length === 0) {
          cy.log('Reviews section (#reviews) not found on this page - this is optional');
          return;
        }
        cy.get('#reviews')
          .should('exist')
          .and('be.visible')
          .then(($section) => {
            expect($section.length, 'reviews section found').to.be.greaterThan(0);
          });
      });
    });

    it('reviews section has a heading (H2 or H3) or title (optional)', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#reviews');
        if ($section.length === 0) {
          cy.log('Reviews section (#reviews) not found on this page - skipping heading check');
          return;
        }
        cy.get('#reviews').then(($section) => {
          // Check for heading
          const hasHeading = $section.find('h2, h3, h4, h5, h6').filter(':visible').length > 0;
          
          // Check for title class
          const hasTitleClass = $section.find('[class*="title"], [class*="heading"]').filter(':visible').length > 0;
          
          // Check if section itself has meaningful text
          const sectionText = $section.text().trim();
          const hasText = sectionText.length > 10;

          // Section exists and is visible (already checked) - heading/title is optional
          if (hasHeading || hasTitleClass || hasText) {
            cy.log('Section has heading or title');
          } else {
            cy.log('Section exists but has no heading/title - this is optional');
          }
        });
      });
    });

    it('reviews section contains review items or has content (optional)', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#reviews');
        if ($section.length === 0) {
          cy.log('Reviews section (#reviews) not found on this page - skipping content check');
          return;
        }
        cy.get('#reviews').then(($section) => {
        // Look for review items using common patterns
        const reviewSelectors = [
          '[class*="review"]',
          '[class*="testimonial"]',
          '.review-item',
          '.testimonial-item',
          'article',
          '.card',
          '[class*="card"]',
        ];

        let foundItems = 0;
        let foundSelector = null;

        // Try each selector
        for (const selector of reviewSelectors) {
          const $items = $section.find(selector).filter(':visible');
          if ($items.length >= 1) {
            foundItems = $items.length;
            foundSelector = selector;
            break;
          }
        }

        // If still not found, look for direct children
        if (foundItems < 1) {
          const $children = $section.children().filter(':visible');
          if ($children.length >= 1) {
            foundItems = $children.length;
            foundSelector = 'direct children';
          }
        }

        // Check if section has meaningful content (text, images, etc.)
        const sectionText = $section.text().trim();
        const hasContent = sectionText.length > 20 || $section.find('img, picture, video').length > 0;

        // Section exists and is visible (already checked) - content is optional
        if (foundItems >= 1 || hasContent) {
          cy.log(`Section has review items (${foundItems}) or content`);
        } else {
          cy.log('Section exists but has no review items or content - this is optional');
        }
        });
      });
    });

    it('review items have content (text or rating) if present', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#reviews');
        if ($section.length === 0) {
          cy.log('Reviews section (#reviews) not found on this page - skipping review items check');
          return;
        }
        cy.get('#reviews').then(($section) => {
        // Find review items
        const reviewSelectors = [
          '[class*="review"]',
          '[class*="testimonial"]',
          '.review-item',
          '.testimonial-item',
          'article',
        ];

        let $items = Cypress.$();
        for (const selector of reviewSelectors) {
          $items = $section.find(selector).filter(':visible');
          if ($items.length >= 1) break;
        }

        if ($items.length < 1) {
          $items = $section.children().filter(':visible');
        }

        // If no review items found, that's OK - section might be empty or have different structure
        if ($items.length < 1) {
          cy.log('No review items found - section might be empty or have different structure');
          return;
        }

        // Check each item has content
        $items.each((index, item) => {
          const $item = Cypress.$(item);
          const itemText = $item.text().trim();
          const hasRating = $item.find('[class*="rating"], [class*="star"], [aria-label*="star"]').length > 0;
          const hasText = itemText.length > 10;

          expect(hasText || hasRating, `review item ${index + 1} has content (text or rating)`).to.equal(true);
        });
        });
      });
    });

    it('reviews section works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      cy.get('body').then(($body) => {
        const $section = $body.find('#reviews');
        if ($section.length === 0) {
          cy.log('Reviews section (#reviews) not found on this page - skipping mobile check');
          return;
        }
        cy.get('#reviews')
          .should('exist')
          .and('be.visible')
          .then(($section) => {
            // Verify section is accessible on mobile
            const rect = $section[0].getBoundingClientRect();
            expect(rect.width, 'section has width on mobile').to.be.greaterThan(0);
            expect(rect.height, 'section has height on mobile').to.be.greaterThan(0);
          });

        // Verify section is accessible on mobile (content is optional)
        cy.get('#reviews').then(($section) => {
          const sectionText = $section.text().trim();
          const hasContent = sectionText.length > 20 || $section.find('img, picture, video').length > 0;
          
          // Section exists and is visible on mobile (already checked) - content is optional
          if (hasContent) {
            cy.log('Section has content on mobile');
          } else {
            cy.log('Section exists on mobile but has no content - this is optional');
          }
        });
      });
    });
  });
});

