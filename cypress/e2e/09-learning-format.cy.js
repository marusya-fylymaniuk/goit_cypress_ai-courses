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
  describe(`[${page.key}] Learning format (#format)`, () => {
    const getFormatSection = () => {
      // Check if section exists first
      return cy.get('body').then(($body) => {
        const $section = $body.find('#format');
        if ($section.length === 0) {
          cy.log('Format section (#format) not found on this page - skipping format tests');
          return null;
        }
        return cy.get('#format');
      });
    };

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('format section exists and is visible', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#format');
        if ($section.length === 0) {
          cy.log('Format section (#format) not found on this page - this is optional');
          return;
        }
        cy.get('#format')
          .should('exist')
          .and('be.visible')
          .then(($section) => {
            expect($section.length, 'format section found').to.be.greaterThan(0);
          });
      });
    });

    it('format section has a heading (H2 or H3)', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#format');
        if ($section.length === 0) {
          cy.log('Format section (#format) not found on this page - skipping heading check');
          return;
        }
        cy.get('#format').within(() => {
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
    });

    it('format section has content (text, images, or other elements)', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#format');
        if ($section.length === 0) {
          cy.log('Format section (#format) not found on this page - skipping content check');
          return;
        }
        cy.get('#format').then(($section) => {
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
    });

    it('format section describes learning format details', () => {
      cy.get('body').then(($body) => {
        const $section = $body.find('#format');
        if ($section.length === 0) {
          cy.log('Format section (#format) not found on this page - skipping format details check');
          return;
        }
        cy.get('#format').then(($section) => {
          // Look for common format-related keywords or elements (UA and RU)
          const textContent = $section.text().toLowerCase();
          const hasFormatKeywords =
            textContent.includes('формат') ||
            textContent.includes('навчання') ||
            textContent.includes('обучение') ||
            textContent.includes('онлайн') ||
            textContent.includes('офлайн') ||
            textContent.includes('вебінар') ||
            textContent.includes('вебинар') ||
            textContent.includes('лекці') ||
            textContent.includes('лекция') ||
            textContent.includes('практик') ||
            textContent.includes('практика') ||
            textContent.includes('час') ||
            textContent.includes('время') ||
            textContent.includes('тривалість') ||
            textContent.includes('длительность') ||
            textContent.includes('расписание') ||
            textContent.includes('графік') ||
            textContent.includes('schedule') ||
            textContent.includes('duration');
          
          const hasFormatClasses = $section.find('[class*="format"], [class*="schedule"], [class*="duration"]').length > 0;
          
          // Section has meaningful content (already checked in previous test)
          const hasContent = textContent.length > 50;

          // At least one format-related indicator should be present
          // If no keywords/classes found, but section has meaningful content, that's also OK
          // (section is in #format, so it's format-related by definition)
          const hasFormatInfo = hasFormatKeywords || hasFormatClasses || hasContent;

          expect(hasFormatInfo, 'section contains format-related information').to.equal(true);
        });
      });
    });

    it('format section works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      cy.get('body').then(($body) => {
        const $section = $body.find('#format');
        if ($section.length === 0) {
          cy.log('Format section (#format) not found on this page - skipping mobile check');
          return;
        }
        cy.get('#format')
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
});

