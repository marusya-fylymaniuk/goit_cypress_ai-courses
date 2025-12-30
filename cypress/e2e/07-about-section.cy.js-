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
  describe(`[${page.key}] About section (#about)`, () => {
    const getAboutSection = () => cy.get('#about');

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('about section exists and is visible', () => {
      getAboutSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          expect($section.length, 'about section found').to.be.greaterThan(0);
        });
    });

    it('about section has a heading (H2 or H3)', () => {
      getAboutSection().within(() => {
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

    it('about section has content (text, images, or other elements)', () => {
      getAboutSection().then(($section) => {
        // Check for text content
        const textContent = $section.text().trim();
        expect(textContent.length, 'section has text content (at least 50 chars)').to.be.at.least(50);

        // Check for structural elements (paragraphs, divs, lists, etc.)
        const hasContentElements =
          $section.find('p, div, ul, ol, article, section').filter(':visible').length > 0 ||
          $section.find('img, picture, video').filter(':visible').length > 0;

        expect(hasContentElements, 'section has content elements (paragraphs, images, etc.)').to.equal(true);
      });
    });

    it('about section has CTA button if present (opens modal)', () => {
      getAboutSection().then(($section) => {
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
          cy.log('No CTA button found in about section - this is optional');
        }
      });
    });

    it('about section works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      getAboutSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          // Verify section is accessible on mobile
          const rect = $section[0].getBoundingClientRect();
          expect(rect.width, 'section has width on mobile').to.be.greaterThan(0);
          expect(rect.height, 'section has height on mobile').to.be.greaterThan(0);

          // Verify content is still present on mobile
          const textContent = $section.text().trim();
          expect(textContent.length, 'section has text content on mobile (at least 50 chars)').to.be.at.least(50);
        });
    });
  });
});

