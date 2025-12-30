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
  describe(`[${page.key}] Footer`, () => {
    const getFooter = () => {
      // Try multiple selectors for footer
      const selectors = [
        'footer',
        '[role="contentinfo"]',
        '[class*="footer"]',
        '#footer',
      ];

      for (const selector of selectors) {
        const $el = Cypress.$(selector);
        if ($el.length > 0 && $el.is(':visible')) {
          return cy.get(selector);
        }
      }
      // Fallback to footer tag
      return cy.get('footer');
    };

    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
    });

    it('footer exists and is visible', () => {
      getFooter()
        .should('exist')
        .and('be.visible')
        .then(($footer) => {
          expect($footer.length, 'footer found').to.be.greaterThan(0);
        });
    });

    it('footer has content (text, links, or other elements)', () => {
      getFooter().then(($footer) => {
        // Check for text content
        const textContent = $footer.text().trim();
        expect(textContent.length, 'footer has text content (at least 20 chars)').to.be.at.least(20);

        // Check for structural elements (links, divs, lists, etc.)
        const hasContentElements =
          $footer.find('a, p, div, ul, ol, nav, section').filter(':visible').length > 0 ||
          $footer.find('img, picture, svg').filter(':visible').length > 0;

        expect(hasContentElements, 'footer has content elements (links, paragraphs, etc.)').to.equal(true);
      });
    });

    it('footer contains links (minimum 1)', () => {
      getFooter().then(($footer) => {
        const $links = $footer.find('a').filter(':visible');
        expect($links.length, 'footer contains at least 1 link').to.be.at.least(1);
      });
    });

    it('footer links use HTTPS (no http:// hrefs)', () => {
      getFooter().then(($footer) => {
        const $links = $footer.find('a[href]').filter(':visible');
        const badLinks = [];

        $links.each((index, link) => {
          const href = link.getAttribute('href');
          if (!href) return;

          const lower = href.toLowerCase();
          // Skip special links
          if (lower.startsWith('mailto:') || lower.startsWith('tel:') || lower.startsWith('#') || lower.startsWith('javascript:')) {
            return;
          }

          // Fail only explicit http:// links (relative links inherit https)
          if (lower.startsWith('http://')) {
            badLinks.push(href);
          }
        });

        expect(badLinks, 'footer links using http://').to.have.length(0);
      });
    });

    it('footer has copyright or company information', () => {
      getFooter().then(($footer) => {
        const textContent = $footer.text().toLowerCase();
        
        // Look for copyright or company-related keywords (UA and RU)
        const hasCopyright =
          textContent.includes('©') ||
          textContent.includes('copyright') ||
          textContent.includes('авторське право') ||
          textContent.includes('авторское право') ||
          textContent.includes('всі права') ||
          textContent.includes('все права') ||
          textContent.includes('all rights') ||
          textContent.includes('goit') ||
          textContent.includes('год') ||
          /\d{4}/.test(textContent); // Year (e.g., 2024, 2025)

        expect(hasCopyright, 'footer contains copyright or company information').to.equal(true);
      });
    });

    it('footer works on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      getFooter()
        .should('exist')
        .and('be.visible')
        .then(($footer) => {
          // Verify footer is accessible on mobile
          const rect = $footer[0].getBoundingClientRect();
          expect(rect.width, 'footer has width on mobile').to.be.greaterThan(0);
          expect(rect.height, 'footer has height on mobile').to.be.greaterThan(0);

          // Verify content is still present on mobile
          const textContent = $footer.text().trim();
          expect(textContent.length, 'footer has text content on mobile (at least 20 chars)').to.be.at.least(20);

          // Verify links are still present on mobile
          const $links = $footer.find('a').filter(':visible');
          expect($links.length, 'footer contains at least 1 link on mobile').to.be.at.least(1);
        });
    });

    it('footer form exists and is visible (if present)', () => {
      getFooter().then(($footer) => {
        const $form = $footer.find('#footerForm, [id*="footerForm"], form[data-form]').first();
        
        if ($form.length > 0) {
          cy.wrap($form).should('be.visible');
          
          // Check for form heading
          const $heading = $form.find('h2').filter(':visible');
          if ($heading.length > 0) {
            const headingText = $heading.text().trim().toLowerCase();
            expect(headingText.length, 'footer form has heading').to.be.greaterThan(0);
          }
        } else {
          cy.log('Footer form not found - this is optional');
        }
      });
    });

    it('footer form has required fields (if form is present)', () => {
      getFooter().then(($footer) => {
        const $form = $footer.find('#footerForm, [id*="footerForm"], form[data-form]').first();
        
        if ($form.length > 0) {
          // Check for name input
          const $nameInput = $form.find('#name-input, input[name*="name"], input[placeholder*="ім\'я"], input[placeholder*="имя"]').first();
          expect($nameInput.length, 'footer form has name input').to.be.greaterThan(0);
          
          // Check for phone input
          const $phoneInput = $form.find('#phone-input, input[type="tel"], input[name*="phone"]').first();
          expect($phoneInput.length, 'footer form has phone input').to.be.greaterThan(0);
          
          // Check for email input
          const $emailInput = $form.find('#email-input, input[type="email"], input[name*="email"]').first();
          expect($emailInput.length, 'footer form has email input').to.be.greaterThan(0);
          
          // Check for policy checkbox
          const $policyCheckbox = $form.find('#user-policy, input[type="checkbox"][name*="policy"]').first();
          expect($policyCheckbox.length, 'footer form has policy checkbox').to.be.greaterThan(0);
        } else {
          cy.log('Footer form not found - skipping field checks');
        }
      });
    });

    it('footer form submit button exists and is clickable (if form is present)', () => {
      getFooter().then(($footer) => {
        const $form = $footer.find('#footerForm, [id*="footerForm"], form[data-form]').first();
        
        if ($form.length > 0) {
          // Look for submit button
          const $submitButton = $form.find('button[type="submit"]').filter(':visible').first();
          
          if ($submitButton.length > 0) {
            cy.wrap($submitButton).should('be.visible');
            cy.wrap($submitButton).should('not.have.attr', 'disabled');
            
            // Verify button has text (consultation-related)
            const buttonText = $submitButton.text().trim().toLowerCase();
            expect(buttonText.length, 'footer form submit button has text').to.be.greaterThan(0);
          } else {
            cy.log('Footer form submit button not found');
          }
        } else {
          cy.log('Footer form not found - skipping submit button check');
        }
      });
    });

    it('footer form works on mobile viewport (if form is present)', () => {
      cy.viewport(375, 667);
      cy.wait(1000); // Wait for responsive layout

      getFooter().then(($footer) => {
        const $form = $footer.find('#footerForm, [id*="footerForm"], form[data-form]').first();
        
        if ($form.length > 0) {
          cy.wrap($form).should('be.visible');
          
          // Verify form is accessible on mobile
          const rect = $form[0].getBoundingClientRect();
          expect(rect.width, 'footer form has width on mobile').to.be.greaterThan(0);
          expect(rect.height, 'footer form has height on mobile').to.be.greaterThan(0);
          
          // Verify form fields are visible on mobile
          const $inputs = $form.find('input[type="text"], input[type="tel"], input[type="email"]').filter(':visible');
          expect($inputs.length, 'footer form has visible inputs on mobile').to.be.at.least(1);
        } else {
          cy.log('Footer form not found - skipping mobile check');
        }
      });
    });

    it('footer form has correct Zoho product mapping (if form is present)', () => {
      getFooter().then(($footer) => {
        const $form = $footer.find('#footerForm, [id*="footerForm"], form[data-form]').first();
        
        if ($form.length > 0 && page.zohoFooter) {
          // Verify Zoho product mapping in hidden inputs
          cy.wrap($form).within(() => {
            cy.get('input[name="fields[product_name]"]').should('have.value', page.zohoFooter.productName);
            cy.get('input[name="fields[product_id]"]').should('have.value', page.zohoFooter.productId);
            cy.get('input[name="form_name"]').should('have.value', page.zohoFooter.formName);
            
            // Check event value in data attribute
            cy.get('.event-data, [data-eventvalue]').should('have.attr', 'data-eventvalue', page.zohoFooter.eventValue);
          });
        } else {
          if (!$form.length) {
            cy.log('Footer form not found - skipping Zoho product mapping check');
          } else if (!page.zohoFooter) {
            cy.log('Zoho footer product data not configured - skipping check');
          }
        }
      });
    });
  });
});

