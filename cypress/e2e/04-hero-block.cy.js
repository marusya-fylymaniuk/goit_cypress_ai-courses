/// <reference types="cypress" />

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
  describe(`[${page.key}] Hero block`, () => {
    const getHero = () => cy.get('section.hero');
    const ctaText = page.expected?.ctaText || 'Записатися на курс';

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
      cy.window().then((win) => win.scrollTo(0, 0));
    });

    it('hero section exists, is visible, and is on first screen', () => {
      getHero().should('exist').and('be.visible');
      getHero().then(($hero) => {
        const rect = $hero[0].getBoundingClientRect();
        const vh = Cypress.config('viewportHeight');
        // Allow a header/banner offset
        expect(rect.top, 'hero top is near top of viewport').to.be.lessThan(180);
        expect(rect.bottom, 'hero extends into viewport').to.be.greaterThan(0);
        expect(rect.top, 'hero is on first screen').to.be.lessThan(vh);
      });
    });

    it('hero contains the H1 with expected text', () => {
      getHero().find('h1').should('have.length', 1).and('be.visible').and('contain', page.expected.h1);
    });

    it('hero has primary CTA button and it is clickable', () => {
      getHero()
        .find('[data-modal-open]')
        .contains(ctaText)
        .should('be.visible')
        .scrollToCenter()
        .click({ force: true });

      // Modal should open (we just verify it appears; full modal behavior is covered in TC#5)
      cy.get('[data-modal].backdrop').should('exist').and('not.have.class', 'is-hidden');
      cy.get('[data-modal] .modal').should('be.visible');
      const modalTitle = page.expected?.modalTitle || 'Записатися на курс';
      cy.contains('[data-modal] h3', modalTitle).should('be.visible');

      // Close to keep tests isolated
      cy.get('[data-modal] button[data-modal-close]').click({ force: true });
      cy.get('[data-modal].backdrop').should('have.class', 'is-hidden');
    });

    it('hero has supporting text (not only the H1)', () => {
      getHero()
        .invoke('text')
        .then((t) => String(t || '').replace(/\s+/g, ' ').trim())
        .then((text) => {
          // Heuristic: there should be meaningful copy in hero besides the title
          expect(text.length, 'hero text length').to.be.greaterThan(30);
        });
    });
  });
});




