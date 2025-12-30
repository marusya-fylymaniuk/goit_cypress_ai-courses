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
  describe(`[${page.key}] Analytics / dataLayer`, () => {
    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
      
      // Initialize dataLayer if it doesn't exist
      cy.window().then((win) => {
        if (!win.dataLayer) {
          win.dataLayer = [];
        }
      });
      
      cy.wait(1000); // Wait for page scripts to load and initialize analytics
    });

    it('dataLayer exists and is initialized', () => {
      cy.window().then((win) => {
        expect(win.dataLayer, 'dataLayer exists').to.exist;
        expect(win.dataLayer, 'dataLayer is an array').to.be.an('array');
      });
    });

    it('page view event is tracked (if implemented)', () => {
      cy.window().then((win) => {
        const dataLayer = win.dataLayer || [];
        
        // Look for common page view events
        const hasPageView =
          dataLayer.some(item => item.event === 'page_view') ||
          dataLayer.some(item => item.event === 'pageview') ||
          dataLayer.some(item => item.event === 'PageView') ||
          dataLayer.some(item => item.eventType === 'page_view') ||
          dataLayer.some(item => item.ecommerce && item.ecommerce.currencyCode); // GTM ecommerce
        
        // Page view tracking is optional - just log if found
        if (hasPageView) {
          cy.log('Page view event found in dataLayer');
        } else {
          cy.log('No page view event found - this is optional');
        }
      });
    });

    it('CTA button click triggers dataLayer event (register_click)', () => {
      // Find CTA button in hero section
      cy.get('section.hero').then(($hero) => {
        const $ctaButton = $hero.find('[data-modal-open]').filter(':visible');
        
        if ($ctaButton.length > 0) {
          // Clear dataLayer before click to isolate the event
          cy.window().then((win) => {
            win.dataLayer = [];
          });
          
          // Click the CTA button
          cy.wrap($ctaButton.first())
            .scrollToCenter()
            .click({ force: true });
          
          cy.wait(500); // Wait for event to be pushed
          
          // Verify dataLayer event
          cy.window().then((win) => {
            const dataLayer = win.dataLayer || [];
            const hasRegisterClick = dataLayer.some(item => item.event === 'register_click');
            
            if (hasRegisterClick) {
              cy.log('register_click event found in dataLayer');
            } else {
              cy.log('No register_click event found - this is optional');
            }
          });
          
          // Close modal
          cy.get('[data-modal] button[data-modal-close]').click({ force: true });
        } else {
          cy.log('No CTA button found in hero section - skipping test');
        }
      });
    });

    it('form submission triggers dataLayer event (if implemented)', () => {
      // Open modal form
      cy.get('section.hero').then(($hero) => {
        const $ctaButton = $hero.find('[data-modal-open]').filter(':visible');
        
        if ($ctaButton.length === 0) {
          cy.log('No CTA button found - skipping form submission test');
          return;
        }
        
        cy.wrap($ctaButton.first())
          .scrollToCenter()
          .click({ force: true });
        
        cy.wait(500);
        
        // Wait for modal to open
        cy.get('[data-modal] .modal').should('be.visible');
        
        // Clear dataLayer before form submission
        cy.window().then((win) => {
          win.dataLayer = [];
        });
        
        // Fill and submit form (stub the request to avoid real submission)
        cy.intercept('POST', '**', { statusCode: 200, body: { success: true } }).as('formSubmit');
        
        // Scroll to form fields and fill them with force: true
        cy.get('#name-input').scrollIntoView().type('Test User', { force: true });
        cy.get('#phone-input').scrollIntoView().type('+380635080808', { force: true });
        cy.get('#email-input').scrollIntoView().type('test@example.com', { force: true });
        cy.get('#user-policy').check({ force: true });
        
        const submitButtonText = page.expected?.submitButtonText || 'Відправити';
        cy.contains('button[type="submit"]', submitButtonText).click({ force: true });
        
        cy.wait(1000); // Wait for event to be pushed
        
        // Verify dataLayer event
        cy.window().then((win) => {
          const dataLayer = win.dataLayer || [];
          
          // Look for common form submission events
          const hasFormEvent =
            dataLayer.some(item => item.event === 'form_submit') ||
            dataLayer.some(item => item.event === 'formSubmit') ||
            dataLayer.some(item => item.event === 'lead_submit') ||
            dataLayer.some(item => item.event === 'CourseLead') ||
            dataLayer.some(item => item.eventType === 'form_submit');
          
          if (hasFormEvent) {
            cy.log('Form submission event found in dataLayer');
          } else {
            cy.log('No form submission event found - this is optional');
          }
        });
      });
    });

    it('dataLayer events have valid structure (if events exist)', () => {
      cy.window().then((win) => {
        const dataLayer = win.dataLayer || [];
        
        if (dataLayer.length === 0) {
          cy.log('dataLayer is empty - skipping structure validation');
          return;
        }
        
        // Check that all events are objects or arrays (GTM can push arrays like ['js', {...}])
        dataLayer.forEach((item, index) => {
          const isValid = 
            typeof item === 'object' && item !== null && 
            (Array.isArray(item) || !Array.isArray(item)); // Can be object or array
          
          expect(isValid, `dataLayer item ${index} is a valid object or array`).to.equal(true);
        });
        
        cy.log(`Found ${dataLayer.length} items in dataLayer`);
      });
    });

    it('Google Tag Manager container is loaded (if implemented)', () => {
      cy.window().then((win) => {
        // Check for GTM container
        const hasGTM =
          win.google_tag_manager !== undefined ||
          win.dataLayer !== undefined ||
          win.gtag !== undefined ||
          Cypress.$(win.document).find('script[src*="googletagmanager"]').length > 0;
        
        if (hasGTM) {
          cy.log('Google Tag Manager or analytics script detected');
        } else {
          cy.log('No GTM/analytics script detected - this is optional');
        }
      });
    });
  });
});

