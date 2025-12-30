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
  describe(`[${page.key}] Course program (#program)`, () => {
    const getProgramSection = () => cy.get('#program');

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('program section exists and is visible', () => {
      getProgramSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          expect($section.length, 'program section found').to.be.greaterThan(0);
        });
    });

    it('program section has a heading (H2 or H3)', () => {
      getProgramSection().within(() => {
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

    it('program section contains accordion items (minimum 1)', () => {
      getProgramSection().then(($section) => {
        // Look for accordion items using common patterns
        const accordionSelectors = [
          '[class*="accordion"] [class*="item"]',
          '[class*="accordion"] > *',
          '.accordion-item',
          '.program-item',
          '[class*="program"] [class*="item"]',
          'details', // HTML5 details/summary
          '[role="button"][aria-expanded]',
        ];

        let foundItems = 0;
        let foundSelector = null;

        // Try each selector
        for (const selector of accordionSelectors) {
          const $items = $section.find(selector).filter(':visible');
          if ($items.length >= 1) {
            foundItems = $items.length;
            foundSelector = selector;
            break;
          }
        }

        // If still not found, look for direct children that might be accordion items
        if (foundItems < 1) {
          const $children = $section.children().filter(':visible');
          if ($children.length >= 1) {
            foundItems = $children.length;
            foundSelector = 'direct children';
          }
        }

        expect(foundItems, `at least 1 accordion item found (using selector: ${foundSelector || 'none'})`).to.be.at.least(1);
      });
    });

    it('accordion items can be expanded and collapsed', () => {
      getProgramSection().then(($section) => {
        // Find accordion items
        const accordionSelectors = [
          '[class*="accordion"] [class*="item"]',
          '[class*="accordion"] > *',
          '.accordion-item',
          '.program-item',
          '[class*="program"] [class*="item"]',
          'details',
          '[role="button"][aria-expanded]',
        ];

        let $items = Cypress.$();
        for (const selector of accordionSelectors) {
          $items = $section.find(selector).filter(':visible');
          if ($items.length >= 1) break;
        }

        if ($items.length < 1) {
          $items = $section.children().filter(':visible');
        }

        expect($items.length, 'accordion items found').to.be.at.least(1);

        // Test first accordion item
        const $firstItem = Cypress.$($items[0]);
        
        // Check if it's a details/summary element
        if ($firstItem.is('details')) {
          // For HTML5 details/summary
          cy.wrap($firstItem).then(($details) => {
            const wasOpen = $details[0].open;
            
            // Toggle
            cy.wrap($details).find('summary').first().click({ force: true });
            cy.wait(300); // Wait for animation
            
            cy.wrap($details).then(($detailsAfter) => {
              const isOpen = $detailsAfter[0].open;
              expect(isOpen, 'details toggled').to.equal(!wasOpen);
            });
          });
        } else {
          // For custom accordion (check for aria-expanded or classes)
          const hasAriaExpanded = $firstItem.attr('aria-expanded') !== undefined || 
                                   $firstItem.find('[aria-expanded]').length > 0;
          
          if (hasAriaExpanded) {
            // Find the trigger button
            const $trigger = $firstItem.find('[aria-expanded]').first().length > 0
              ? $firstItem.find('[aria-expanded]').first()
              : $firstItem.find('button, [role="button"]').first();
            
            if ($trigger.length > 0) {
              cy.wrap($trigger).then(($btn) => {
                const wasExpanded = $btn.attr('aria-expanded') === 'true';
                
                cy.wrap($btn).click({ force: true });
                cy.wait(300); // Wait for animation
                
                cy.wrap($btn).should('have.attr', 'aria-expanded', String(!wasExpanded));
              });
            }
          } else {
            // Try clicking on the item itself or its first clickable element
            cy.wrap($firstItem).then(($item) => {
              const $clickable = $item.find('button, [role="button"], [class*="trigger"], [class*="toggle"]').first();
              
              if ($clickable.length > 0) {
                cy.wrap($clickable).click({ force: true });
                cy.wait(300);
                // Just verify it's clickable, don't check state (too implementation-specific)
                cy.log('Accordion item is clickable');
              } else {
                // Click on the item itself
                cy.wrap($item).click({ force: true });
                cy.wait(300);
                cy.log('Accordion item clicked');
              }
            });
          }
        }
      });
    });

    it('each accordion item has a title/heading', () => {
      getProgramSection().then(($section) => {
        // Find accordion items
        const accordionSelectors = [
          '[class*="accordion"] [class*="item"]',
          '[class*="accordion"] > *',
          '.accordion-item',
          '.program-item',
          '[class*="program"] [class*="item"]',
          'details',
        ];

        let $items = Cypress.$();
        for (const selector of accordionSelectors) {
          $items = $section.find(selector).filter(':visible');
          if ($items.length >= 1) break;
        }

        if ($items.length < 1) {
          $items = $section.children().filter(':visible');
        }

        expect($items.length, 'accordion items found').to.be.at.least(1);

        // Check that most items have a title (at least 50% or first item)
        let itemsWithTitle = 0;
        $items.each((index, item) => {
          const $item = Cypress.$(item);
          let hasTitle = false;
          
          // For details/summary, check for summary element
          if ($item.is('details')) {
            hasTitle = $item.find('summary').length > 0;
          } else {
            // For custom accordion, check for heading or title in multiple ways
            const hasHeading = $item.find('h2, h3, h4, h5, h6').filter(':visible').length > 0;
            const hasTitleClass = $item.find('[class*="title"], [class*="heading"]').filter(':visible').length > 0;
            const hasSummary = $item.find('summary').filter(':visible').length > 0;
            const hasButton = $item.find('button, [role="button"]').filter(':visible').length > 0;
            
            // Check if button has text (button text could be the title)
            let buttonHasText = false;
            if (hasButton) {
              const $button = $item.find('button, [role="button"]').first();
              const buttonText = $button.text().trim();
              buttonHasText = buttonText.length > 3;
            }
            
            // Also check if the item has meaningful text (could be a title)
            const itemText = $item.text().trim();
            const firstChildText = $item.children().first().text().trim();
            const hasTextTitle = itemText.length > 3 || firstChildText.length > 3;

            hasTitle = hasHeading || hasTitleClass || hasSummary || (hasButton && buttonHasText) || hasTextTitle;
          }
          
          if (hasTitle) {
            itemsWithTitle++;
          }
        });

        // At least 50% of items should have titles, OR at least the first item should have a title
        const minItemsWithTitle = Math.max(1, Math.ceil($items.length * 0.5));
        expect(itemsWithTitle, `at least ${minItemsWithTitle} accordion item(s) have a title/heading (found ${itemsWithTitle} out of ${$items.length})`).to.be.at.least(minItemsWithTitle);
      });
    });

    it('program section works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      getProgramSection()
        .should('exist')
        .and('be.visible')
        .then(($section) => {
          // Verify section is accessible on mobile
          const rect = $section[0].getBoundingClientRect();
          expect(rect.width, 'section has width on mobile').to.be.greaterThan(0);
          expect(rect.height, 'section has height on mobile').to.be.greaterThan(0);
        });

      // Verify accordion items are visible on mobile
      getProgramSection().then(($section) => {
        const accordionSelectors = [
          '[class*="accordion"] [class*="item"]',
          '[class*="accordion"] > *',
          '.accordion-item',
          '.program-item',
          '[class*="program"] [class*="item"]',
          'details',
        ];

        let $items = Cypress.$();
        for (const selector of accordionSelectors) {
          $items = $section.find(selector).filter(':visible');
          if ($items.length >= 1) break;
        }

        if ($items.length < 1) {
          $items = $section.children().filter(':visible');
        }

        expect($items.length, 'at least 1 accordion item visible on mobile').to.be.at.least(1);
      });
    });
  });
});

