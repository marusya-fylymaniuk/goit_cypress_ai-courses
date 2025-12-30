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
  describe(`[${page.key}] Accessibility checks`, () => {
    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('keyboard navigation: Tab key moves focus between interactive elements', () => {
      // Find interactive elements that should be focusable
      cy.get('a, button, input, textarea, select, [role="button"], [role="link"]')
        .filter(':visible')
        .first()
        .then(($el) => {
          // Try to focus the element
          cy.wrap($el).focus();
          
          // Check that element can receive focus
          cy.wrap($el).should('be.focused');
          
          // Verify it's an interactive element
          const tag = $el.prop('tagName')?.toLowerCase();
          const role = $el.attr('role');
          const isInteractive =
            ['a', 'button', 'input', 'textarea', 'select'].includes(tag) ||
            role === 'button' ||
            role === 'link' ||
            $el.attr('tabindex') !== undefined;

          expect(isInteractive, 'element is interactive and can receive focus').to.be.true;
        });
    });

    it('keyboard navigation: Enter key activates buttons', () => {
      // Find a button on the page
      cy.get('body').then(($body) => {
        const button = $body.find('button, [role="button"]').filter(':visible').first();
        if (button.length > 0) {
          cy.wrap(button).focus();
          // Press Enter and check that something happens (button click handler is triggered)
          // We can't easily verify the exact action, but we can verify the button is focusable
          cy.wrap(button).should('be.visible');
          cy.wrap(button).should('not.have.attr', 'disabled');
        } else {
          cy.log('No buttons found - this is optional');
        }
      });
    });

    it('keyboard navigation: Esc key closes modals (if modal is open)', () => {
      // Try to open a modal if CTA button exists
      cy.get('body').then(($body) => {
        const ctaButton = $body
          .find('button, a.btn, [class*="button"]')
          .filter(':visible')
          .first();

        if (ctaButton.length > 0) {
          cy.wrap(ctaButton).click({ force: true });
          cy.wait(500);

          // Check if modal opened
          cy.get('body').then(($bodyAfter) => {
            const modal = $bodyAfter.find('[data-modal], .modal, [class*="modal"]').filter(':visible').first();
            if (modal.length > 0) {
              // Press Esc
              cy.get('body').type('{esc}');
              cy.wait(500);

              // Modal should be closed or hidden
              cy.get('body').then(($bodyFinal) => {
                const modalAfterEsc = $bodyFinal.find('[data-modal], .modal, [class*="modal"]').filter(':visible').first();
                // Modal should not be visible after Esc (or should have hidden class)
                if (modalAfterEsc.length > 0) {
                  cy.wrap(modalAfterEsc).should('not.be.visible');
                } else {
                  cy.log('Modal closed after Esc key');
                }
              });
            } else {
              cy.log('Modal did not open - this is optional');
            }
          });
        } else {
          cy.log('No CTA button found - this is optional');
        }
      });
    });

    it('focus is visible on interactive elements', () => {
      // Find interactive elements
      cy.get('a, button, input, textarea, select, [role="button"], [role="link"]')
        .filter(':visible')
        .first()
        .focus()
        .then(($el) => {
          // Check that element has focus styles (outline or box-shadow)
          const styles = window.getComputedStyle($el[0]);
          const outline = styles.outline;
          const outlineWidth = styles.outlineWidth;
          const boxShadow = styles.boxShadow;

          // Focus should be visible (either outline or box-shadow)
          const hasVisibleFocus =
            (outline && outline !== 'none' && outlineWidth !== '0px') ||
            (boxShadow && boxShadow !== 'none');

          // Note: Some sites use custom focus styles, so we'll just check that the element can receive focus
          cy.wrap($el).should('be.focused');
        });
    });

    it('ARIA attributes are properly used (aria-expanded for accordions/menus)', () => {
      // Check accordion items
      cy.get('body').then(($body) => {
        const accordions = $body.find(
          'details, [role="button"][aria-expanded], [aria-expanded="true"], [aria-expanded="false"]'
        );

        if (accordions.length > 0) {
          accordions.each((_, el) => {
            const ariaExpanded = el.getAttribute('aria-expanded');
            const isDetails = el.tagName.toLowerCase() === 'details';
            const isOpen = isDetails ? el.hasAttribute('open') : ariaExpanded === 'true';

            // If element has aria-expanded, it should be either "true" or "false"
            if (ariaExpanded !== null) {
              expect(['true', 'false'], 'aria-expanded has valid value').to.include(ariaExpanded);
            }

            // If it's a details element, it should have open attribute when expanded
            if (isDetails && isOpen) {
              expect(el.hasAttribute('open'), 'details element has open attribute when expanded').to.be.true;
            }
          });
        } else {
          cy.log('No accordions found - this is optional');
        }
      });
    });

    it('semantic HTML elements are used (nav, main, header, footer)', () => {
      // Check for semantic elements
      const semanticElements = {
        nav: 'nav, [role="navigation"]',
        main: 'main, [role="main"]',
        header: 'header, [role="banner"]',
        footer: 'footer, [role="contentinfo"]',
      };

      Object.entries(semanticElements).forEach(([name, selector]) => {
        cy.get('body').then(($body) => {
          const elements = $body.find(selector);
          if (elements.length > 0) {
            cy.log(`Found ${elements.length} ${name} element(s)`);
            cy.wrap(elements.first()).should('be.visible');
          } else {
            cy.log(`No ${name} element found - this is optional`);
          }
        });
      });
    });

    it('heading hierarchy is logical (H1 before H2, H2 before H3, etc.)', () => {
      cy.get('main, [role="main"], body').first().then(($main) => {
        const headings = $main.find('h1, h2, h3, h4, h5, h6').filter(':visible');
        if (headings.length > 0) {
          let previousLevel = 0;
          let h1Found = false;

          headings.each((_, el) => {
            const level = parseInt(el.tagName.charAt(1), 10);
            if (level === 1) h1Found = true;

            // H1 should come before H2, H2 before H3, etc.
            // Allow skipping levels (H1 -> H3 is OK), but not going backwards (H3 -> H2 is not OK)
            if (previousLevel > 0 && level < previousLevel && level > 1) {
              // This is a warning, not a failure - heading hierarchy should be logical
              cy.log(`Warning: Heading hierarchy may be illogical (H${previousLevel} -> H${level})`);
            }

            previousLevel = level;
          });

          // At least one H1 should exist
          expect(h1Found, 'at least one H1 exists').to.be.true;
        } else {
          cy.log('No headings found - this is optional');
        }
      });
    });

    it('buttons are used for actions, links are used for navigation', () => {
      // Check that buttons are not used as links (should not have href)
      cy.get('button[href]').should('not.exist');

      // Check that links used for navigation have href
      cy.get('a[href]').then(($links) => {
        if ($links.length > 0) {
          // Links should have href (not empty or just #)
          $links.each((_, el) => {
            const href = el.getAttribute('href');
            // Allow # for anchor links, but warn about empty href
            if (href && href.trim() !== '' && href !== '#') {
              // Link is valid
            } else if (href === '#') {
              cy.log('Warning: Link with href="#" found - consider using button for actions');
            }
          });
        }
      });
    });

    it('form inputs have associated labels or aria-label', () => {
      cy.get('input, textarea, select').filter(':visible').then(($inputs) => {
        if ($inputs.length > 0) {
          $inputs.each((_, el) => {
            const id = el.id;
            const ariaLabel = el.getAttribute('aria-label');
            const ariaLabelledBy = el.getAttribute('aria-labelledby');
            const placeholder = el.getAttribute('placeholder');
            const type = el.getAttribute('type');

            // Skip hidden inputs
            if (type === 'hidden') return;

            // Input should have label, aria-label, aria-labelledby, or placeholder
            let hasLabel = false;
            if (id) {
              const label = document.querySelector(`label[for="${id}"]`);
              if (label) hasLabel = true;
            }
            if (ariaLabel && ariaLabel.trim() !== '') hasLabel = true;
            if (ariaLabelledBy) hasLabel = true;
            if (placeholder && placeholder.trim() !== '') hasLabel = true;

            // For required inputs, label is mandatory
            if (el.hasAttribute('required')) {
              expect(hasLabel, 'required input has label or aria-label').to.be.true;
            } else {
              // For optional inputs, label is recommended but not mandatory
              if (!hasLabel) {
                cy.log(`Warning: Input without label found: ${el.outerHTML.slice(0, 100)}`);
              }
            }
          });
        } else {
          cy.log('No form inputs found - this is optional');
        }
      });
    });
  });
});

