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

// Viewport sizes for responsive testing
const viewports = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1920, height: 1080 }, // Full HD
};

targetPages.forEach((page) => {
  describe(`[${page.key}] Responsive / Cross-browser checks`, () => {
    it('page loads correctly on mobile viewport (375x667)', () => {
      cy.viewport(viewports.mobile.width, viewports.mobile.height);
      cy.visit(page.url);
      cy.wait(1000); // Wait for responsive layout

      // Check that page loads without errors
      cy.get('body').should('be.visible');
      cy.title().should('not.be.empty');

      // Check that there's no horizontal scroll
      cy.window().then((win) => {
        const bodyWidth = win.document.body.scrollWidth;
        const viewportWidth = win.innerWidth;
        expect(bodyWidth, 'no horizontal scroll on mobile').to.be.at.most(viewportWidth + 5); // Allow 5px tolerance
      });
    });

    it('page loads correctly on tablet viewport (768x1024)', () => {
      cy.viewport(viewports.tablet.width, viewports.tablet.height);
      cy.visit(page.url);
      cy.wait(1000); // Wait for responsive layout

      // Check that page loads without errors
      cy.get('body').should('be.visible');
      cy.title().should('not.be.empty');

      // Check that there's no horizontal scroll
      cy.window().then((win) => {
        const bodyWidth = win.document.body.scrollWidth;
        const viewportWidth = win.innerWidth;
        expect(bodyWidth, 'no horizontal scroll on tablet').to.be.at.most(viewportWidth + 5); // Allow 5px tolerance
      });
    });

    it('page loads correctly on desktop viewport (1920x1080)', () => {
      cy.viewport(viewports.desktop.width, viewports.desktop.height);
      cy.visit(page.url);
      cy.wait(1000); // Wait for responsive layout

      // Check that page loads without errors
      cy.get('body').should('be.visible');
      cy.title().should('not.be.empty');

      // Check that there's no horizontal scroll
      cy.window().then((win) => {
        const bodyWidth = win.document.body.scrollWidth;
        const viewportWidth = win.innerWidth;
        expect(bodyWidth, 'no horizontal scroll on desktop').to.be.at.most(viewportWidth + 5); // Allow 5px tolerance
      });
    });

    it('hero section is visible and properly sized on all viewports', () => {
      const viewportList = [
        { name: 'mobile', ...viewports.mobile },
        { name: 'tablet', ...viewports.tablet },
        { name: 'desktop', ...viewports.desktop },
      ];

      viewportList.forEach((vp) => {
        cy.viewport(vp.width, vp.height);
        cy.visit(page.url);
        cy.wait(1000);

        // Find hero section (flexible selectors)
        cy.get('body').then(($body) => {
          const hero = $body.find('#hero, section.hero, [class*="hero"]').first();
          if (hero.length > 0) {
            cy.wrap(hero).should('be.visible');
            cy.wrap(hero).then(($el) => {
              const rect = $el[0].getBoundingClientRect();
              expect(rect.width, `hero has width on ${vp.name}`).to.be.greaterThan(0);
              expect(rect.height, `hero has height on ${vp.name}`).to.be.greaterThan(0);
              // Hero should not exceed viewport width
              expect(rect.width, `hero fits viewport on ${vp.name}`).to.be.at.most(vp.width + 10);
            });
          } else {
            cy.log(`Hero section not found on ${vp.name} viewport - this is optional`);
          }
        });
      });
    });

    it('main content is readable on all viewports (text is not too small)', () => {
      const viewportList = [
        { name: 'mobile', ...viewports.mobile },
        { name: 'tablet', ...viewports.tablet },
        { name: 'desktop', ...viewports.desktop },
      ];

      viewportList.forEach((vp) => {
        cy.viewport(vp.width, vp.height);
        cy.visit(page.url);
        cy.wait(1000);

        // Check that main content exists and has readable text
        cy.get('main, [role="main"], body').first().then(($main) => {
          const textContent = $main.text().trim();
          expect(textContent.length, `main content has text on ${vp.name}`).to.be.greaterThan(50);

          // Check that at least some text elements have reasonable font size
          // Note: Some elements (like small labels) may have smaller font, which is OK
          cy.get('body').then(($body) => {
            const paragraphs = $body.find('p, h1, h2, h3, h4, h5, h6').filter(':visible').slice(0, 10);
            if (paragraphs.length > 0) {
              let hasReadableText = false;
              paragraphs.each((_, el) => {
                const fontSize = parseFloat(getComputedStyle(el).fontSize);
                // At least some text should be readable (>= 12px)
                if (fontSize >= 12) {
                  hasReadableText = true;
                }
              });
              // At least one element should have readable font size
              expect(hasReadableText, `at least some text is readable (font-size >= 12px) on ${vp.name}`).to.be.true;
            }
          });
        });
      });
    });

    it('interactive elements (buttons, links) are clickable on all viewports', () => {
      const viewportList = [
        { name: 'mobile', ...viewports.mobile },
        { name: 'tablet', ...viewports.tablet },
        { name: 'desktop', ...viewports.desktop },
      ];

      viewportList.forEach((vp) => {
        cy.viewport(vp.width, vp.height);
        cy.visit(page.url);
        cy.wait(1000);

        // Check that buttons are visible and have reasonable size
        // Note: Not all buttons need to be 44px - some decorative buttons may be smaller
        cy.get('body').then(($body) => {
          const buttons = $body.find('button, a.btn, [class*="button"], [role="button"]').filter(':visible').slice(0, 5);
          if (buttons.length > 0) {
            let hasProperSizeButton = false;
            buttons.each((_, el) => {
              const rect = el.getBoundingClientRect();
              // Buttons should be at least 44x44px for touch targets (mobile) or 24x24px (desktop)
              const minSize = vp.name === 'mobile' ? 44 : 24;
              // At least one button should have proper size
              if (rect.width >= minSize && rect.height >= minSize) {
                hasProperSizeButton = true;
              }
            });
            // At least one button should have proper size for touch/click
            expect(hasProperSizeButton, `at least one button has proper size (${vp.name === 'mobile' ? '44x44' : '24x24'}px) on ${vp.name}`).to.be.true;
          } else {
            cy.log(`No buttons found on ${vp.name} viewport - this is optional`);
          }
        });
      });
    });
  });
});

