/// <reference types="cypress" />

// Data-driven pages config (add more pages in cypress/fixtures/pages.json)
// Using require() here keeps it synchronous so we can generate per-page test blocks safely.
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

// Fixed test lead data (per your requirement: only these values for valid form fills)
const TEST_LEAD = {
  name: 'testmarusyacypress',
  phone: '+380635080808',
  email: 'testmarusyacypress2026@qa.team',
};

// Form validation: ON by default.
// If you ever need to disable temporarily: --env SKIP_FORM_VALIDATION=true
const SKIP_FORM_VALIDATION =
  String(Cypress.env('SKIP_FORM_VALIDATION') || '').toLowerCase() === 'true';
const validationIt = SKIP_FORM_VALIDATION ? it.skip : it;

// Some rules below are "strict business rules" that the current site may not enforce yet.
// Enable them when you want the suite to fail for any mismatch:
//   --env STRICT_VALIDATION=true
const STRICT_VALIDATION =
  String(Cypress.env('STRICT_VALIDATION') || '').toLowerCase() === 'true';
const strictIt = STRICT_VALIDATION ? validationIt : validationIt.skip;

targetPages.forEach((page) => {
  describe(`[${page.key}] Modal "Записатися на курс" (форма)`, () => {
    const getBackdrop = () => cy.get('[data-modal].backdrop');
    const getModal = () => cy.get('[data-modal] .modal');
    const withinModal = (fn) => getModal().should('be.visible').within(fn);
    const getForm = () => cy.get('[data-modal] form[data-form]');
    const getNameInput = () => cy.get('[data-modal] #name-input');
    const getPhoneInput = () => cy.get('[data-modal] #phone-input');
    const getEmailInput = () => cy.get('[data-modal] #email-input');
    const getPolicyCheckbox = () => cy.get('[data-modal] #user-policy');

    const fillValidForm = ({
      name = TEST_LEAD.name,
      phone = TEST_LEAD.phone,
      email = TEST_LEAD.email,
      acceptPolicy = true,
    } = {}) => {
      getNameInput().scrollIntoView().clear({ force: true }).type(name, { force: true });
      getPhoneInput()
        .scrollIntoView()
        .invoke('val', phone)
        .trigger('input', { force: true })
        .trigger('change', { force: true });
      getEmailInput().scrollIntoView().clear({ force: true }).type(email, { force: true });
      if (acceptPolicy) getPolicyCheckbox().check({ force: true });
    };

    const safeBodyText = (body) => {
      // Convert request.body to string for safe "includes" checks.
      // IMPORTANT: do not print the body (it may contain personal data).
      try {
        if (typeof body === 'string') return body;
        if (typeof FormData !== 'undefined' && body instanceof FormData) return null;
        // eslint-disable-next-line no-undef
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) return body.toString('utf8');
        if (body instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(body));
        if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body);
        if (body && typeof body === 'object') return JSON.stringify(body);
        return null;
      } catch {
        return null;
      }
    };

    const openFromHero = () => {
      cy.window().then((win) => win.scrollTo(0, 0));
      const ctaText = page.expected?.ctaText || 'Записатися на курс';
      cy.get('section.hero')
        .find('button[data-modal-open], a[data-modal-open]')
        .contains(ctaText)
        .should('be.visible')
        .scrollToCenter()
        .click({ force: true });
    };

    const openFromAbout = () => {
      cy.get('#about')
        .find('[data-modal-open]')
        .first()
        .should('be.visible')
        .scrollToCenter()
        .click({ force: true });
    };

    const assertOpen = () => {
      getBackdrop().should('exist').and('not.have.class', 'is-hidden');
      getModal().should('be.visible');
      const modalTitle = page.expected?.modalTitle || 'Записатися на курс';
      cy.contains('[data-modal] h3', modalTitle).should('be.visible');
    };

    const closeWithX = () => {
      withinModal(() => {
        cy.get('button[data-modal-close]').should('be.visible').click({ force: true });
      });
    };

    const assertClosed = () => {
      // Some runs hide by class; assert both class + modal not visible for stability.
      getBackdrop().should('have.class', 'is-hidden');
      getModal().should('not.be.visible');
    };

    const resetForm = () => {
      withinModal(() => {
        cy.get('#name-input').scrollIntoView().clear({ force: true });
        cy.get('#email-input').scrollIntoView().clear({ force: true });
        cy.get('#phone-input')
          .scrollIntoView()
          .invoke('val', '')
          .trigger('input', { force: true })
          .trigger('change', { force: true });
        cy.get('#user-policy').then(($el) => {
          if ($el.is(':checked')) cy.wrap($el).uncheck({ force: true });
        });
      });
    };

    beforeEach(() => {
      cy.visit(page.url);
    });

    it('opens from hero and closes via close (X) button', () => {
      openFromHero();
      assertOpen();
      closeWithX();
      assertClosed();
    });

    it('opens from #about and closes via overlay click', () => {
      openFromAbout();
      assertOpen();
      getBackdrop().click('topLeft', { force: true });
      assertClosed();
    });

    it('closes via Esc', () => {
      openFromHero();
      assertOpen();
      getModal().click('topLeft', { force: true });
      cy.get('body').type('{esc}', { force: true });
      assertClosed();
    });

    validationIt('has required form fields and constraints (basic HTML attrs)', () => {
      openFromHero();
      assertOpen();

      withinModal(() => {
        cy.get('form[data-form]').should(($form) => {
          expect($form).to.have.attr('action');
          expect($form.attr('action')).to.include('/wp/wp-admin/admin-post.php');
        });

        cy.get('#name-input').should(($el) => {
          expect($el).to.have.attr('required');
          expect($el).to.have.attr('minlength', '2');
          expect($el).to.have.attr('maxlength', '30');
        });

        cy.get('#phone-input').should(($el) => {
          expect($el).to.have.attr('required');
          expect($el).to.have.attr('type', 'tel');
          expect($el).to.have.attr('pattern');
        });

        cy.get('#email-input').should(($el) => {
          expect($el).to.have.attr('required');
          expect($el).to.have.attr('type', 'email');
          expect($el).to.have.attr('maxlength', '63');
        });

        cy.get('#user-policy').should(($el) => {
          expect($el).to.have.attr('required');
          expect($el).to.have.attr('type', 'checkbox');
        });

        const submitText = page.expected?.submitButtonText || 'Відправити';
        cy.get('form[data-form] button[type="submit"]').contains(submitText, { matchCase: false }).should('be.visible');
      });
    });

    validationIt('validation rules: Name field accepts required alphabets/symbols/spaces and max length 30', () => {
      openFromHero();
      assertOpen();
      resetForm();

      const setName = (value) =>
        getNameInput().scrollIntoView().clear({ force: true }).type(value, { force: true });

      // Latin
      setName('John Doe');
      getNameInput().then(($el) => expect($el[0].checkValidity(), 'latin name is valid').to.equal(true));

      // Cyrillic
      setName('Марія');
      getNameInput().then(($el) =>
        expect($el[0].checkValidity(), 'cyrillic name is valid').to.equal(true),
      );

      // Ukrainian + allowed symbols: ЯяЇїІіЄєҐґ 'ʼ`- and space
      const special = "ЯяЇїІіЄєҐґ'ʼ`- Марія";
      setName(special);
      getNameInput()
        .invoke('val')
        .then((val) => {
          // Some implementations may trim trailing spaces; we only require that the chars are accepted.
          expect(String(val)).to.include('Марія');
        });
      getNameInput().then(($el) =>
        expect($el[0].checkValidity(), 'ukrainian letters/symbols/spaces are valid').to.equal(true),
      );

      // Space after last character should still be valid
      const trailingSpace = 'Марія ';
      setName(trailingSpace);
      getNameInput()
        .invoke('val')
        .then((val) => {
          const v = String(val);
          expect(v === trailingSpace || v === trailingSpace.trimEnd(), 'trailing space accepted/trimmed').to.equal(true);
        });
      getNameInput().then(($el) =>
        expect($el[0].checkValidity(), 'trailing space is valid').to.equal(true),
      );

      // Max length 30
      const longName = 'A'.repeat(31);
      setName(longName);
      getNameInput()
        .invoke('val')
        .then((val) => {
          expect(String(val).length, 'name length is capped to 30').to.equal(30);
        });
    });

    validationIt('validation rules: Phone accepts only digits (and optional +); letters are rejected', () => {
      openFromHero();
      assertOpen();
      resetForm();

      const setPhone = (value) =>
        getPhoneInput()
          .scrollIntoView()
          .invoke('val', value)
          .trigger('input', { force: true })
          .trigger('change', { force: true });

      // Only digits
      // Use a realistic UA number in digits-only form (no spaces)
      setPhone('380635080808');
      getPhoneInput()
        .invoke('val')
        .then((val) => {
          expect(String(val)).to.match(/^[0-9+]*$/, 'phone contains only digits (and optional +)');
          expect(String(val).includes(' '), 'phone contains no spaces').to.equal(false);
        });

      // Letters are not accepted (either removed OR make field invalid)
      setPhone('123abc');
      getPhoneInput().then(($el) => {
        const val = String($el.val() || '');
        const containsLetters = /[A-Za-zА-Яа-яЇїІіЄєҐґ]/.test(val);
        const valid = $el[0].checkValidity();
        // Rule: "phone accepts only digits" → if letters are present, the field must be invalid.
        if (containsLetters) {
          expect(valid, 'phone with letters must be invalid').to.equal(false);
        } else {
          expect(val).to.match(/^[0-9+]*$/, 'phone contains only digits (and optional +)');
          expect(val.includes(' '), 'phone contains no spaces').to.equal(false);
        }
      });
    });

    validationIt('validation rules: Email format and allowed characters', () => {
      openFromHero();
      assertOpen();
      resetForm();

      const setEmail = (value) =>
        getEmailInput().scrollIntoView().clear({ force: true }).type(value, { force: true });

      const fillRequiredForSubmit = () => {
        getNameInput().scrollIntoView().clear({ force: true }).type('Марія', { force: true });
        getPhoneInput()
          .scrollIntoView()
          .invoke('val', TEST_LEAD.phone)
          .trigger('input', { force: true })
          .trigger('change', { force: true });
        getPolicyCheckbox().check({ force: true });
      };

      const expectBlockedOnSubmitIfHtmlThinksValid = (emailValue, reason) => {
        setEmail(emailValue);
        // If HTML5 validation already blocks it -> good.
        getEmailInput().then(($el) => {
          if ($el[0].checkValidity() === false) return;

          // Otherwise, try to submit (stubbed) and assert request is NOT sent.
          let sent = false;
          cy.intercept('POST', '**/wp/wp-admin/admin-post.php', (req) => {
            sent = true;
            // App code parses JSON from the response. Return valid JSON to avoid uncaught exceptions.
            req.reply({
              statusCode: 200,
              headers: { 'content-type': 'application/json' },
              body: { ok: true },
            });
          }).as('emailGuardSubmit');

          fillRequiredForSubmit();
          withinModal(() => {
            const submitText = page.expected?.submitButtonText || 'Відправити';
            cy.get('button[type="submit"]').contains(submitText, { matchCase: false }).click({ force: true });
          });

          cy.wait(1000).then(() => {
            expect(sent, reason).to.equal(false);
          });
        });
      };

      // At least 1 char before @
      setEmail('@example.com');
      getEmailInput().then(($el) =>
        expect($el[0].checkValidity(), 'no local-part is invalid').to.equal(false),
      );

      // Allowed chars in local part: latin letters, digits, hyphen, underscore, dot, plus
      setEmail('User.Name+tag_1-2@example.com');
      getEmailInput().then(($el) =>
        expect($el[0].checkValidity(), 'allowed local-part chars are valid').to.equal(true),
      );

      // Strict business rules (enable via STRICT_VALIDATION=true)
      if (STRICT_VALIDATION) {
        // Hyphen cannot be at the start or end of the whole email
        expectBlockedOnSubmitIfHtmlThinksValid(
          '-user@example.com',
          'email cannot start with hyphen (must be blocked)',
        );
        expectBlockedOnSubmitIfHtmlThinksValid(
          'user@example.com-',
          'email cannot end with hyphen (must be blocked)',
        );

        // Dot cannot be at the start or end of local-part
        expectBlockedOnSubmitIfHtmlThinksValid(
          '.user@example.com',
          'local-part cannot start with dot (must be blocked)',
        );
        expectBlockedOnSubmitIfHtmlThinksValid(
          'user.@example.com',
          'local-part cannot end with dot (must be blocked)',
        );
      }

      // Max length 63
      getEmailInput().should('have.attr', 'maxlength', '63');
      const tooLongEmail = `${'a'.repeat(60)}@b.co`; // 65 chars
      setEmail(tooLongEmail);
      getEmailInput()
        .invoke('val')
        .then((val) => expect(String(val).length, 'email is capped to maxlength=63').to.equal(63));

      // Uppercase is allowed (A-Z)
      setEmail('TEST.USER+TAG@EXAMPLE.COM');
      getEmailInput().then(($el) =>
        expect($el[0].checkValidity(), 'uppercase email is valid').to.equal(true),
      );
    });

    it.skip('submits form (stubbed) and verifies successful submission', () => {
      // STUBBED TEST IS DISABLED - Using REAL test instead
      openFromHero();
      assertOpen();
      resetForm();

      // Verify mapping in hidden inputs
      withinModal(() => {
        cy.get('input[name="fields[product_name]"]').should('have.value', page.zoho.productName);
        cy.get('input[name="fields[product_id]"]').should('have.value', page.zoho.productId);
        cy.get('input[name="form_name"]').should('have.value', page.zoho.formName);
        cy.get('.event-data').should('have.attr', 'data-eventvalue', page.zoho.eventValue);
      });

      // Stub the submit request with successful response
      cy.intercept('POST', '**/wp/wp-admin/admin-post.php', {
        statusCode: 200,
        body: { success: true, message: 'Form submitted successfully' },
      }).as('formSubmitStub');

      fillValidForm();

      getForm().then(($form) => {
        expect($form[0].checkValidity()).to.equal(true);
      });

      withinModal(() => {
        const submitText = page.expected?.submitButtonText || 'Відправити';
        cy.get('button[type="submit"]').contains(submitText, { matchCase: false }).click({ force: true });
      });

      // Wait for the stubbed request
      cy.wait('@formSubmitStub', { timeout: 10000 }).then(({ request, response }) => {
        // Verify request was sent
        expect(request).to.exist;
        
        // Verify response is successful
        if (response) {
          expect([200, 201, 202, 302, 303], 'submit response status').to.include(response.statusCode);
        }

        // Verify request body contains required data (PII-safe check)
        const body = request.body;
        if (typeof FormData !== 'undefined' && body instanceof FormData) {
          expect(body.get('fields[product_name]'), 'fields[product_name]').to.equal(page.zoho.productName);
          expect(body.get('fields[product_id]'), 'fields[product_id]').to.equal(page.zoho.productId);
          expect(body.get('form_name'), 'form_name').to.equal(page.zoho.formName);
          expect(body.get('action'), 'action').to.equal('zoho_connector_form');
        } else {
          const text = safeBodyText(body) || '';
          expect(text.includes(page.zoho.productName), 'body includes product_name value').to.equal(true);
          expect(text.includes(page.zoho.productId), 'body includes product_id value').to.equal(true);
          expect(text.includes(page.zoho.formName), 'body includes form_name value').to.equal(true);
          expect(text.includes('zoho_connector_form'), 'body includes action value').to.equal(true);
        }
      });

      // Verify success state: success message in modal
      // After successful submission, the modal shows a success message
      // Structure: [data-messages] container becomes visible, [data-text-success] becomes visible
      withinModal(() => {
        // Wait for success message container to appear (it starts as hidden)
        cy.get('[data-messages]', { timeout: 10000 })
          .should('be.visible')
          .should('not.have.class', 'hidden');
        
        // Verify success message element is visible (removes is-hidden class)
        cy.get('[data-text-success]', { timeout: 10000 })
          .should('be.visible')
          .should('not.have.class', 'is-hidden');
        
        // Verify success message contains thank-you text
        cy.get('[data-text-success]')
          .should('contain', 'Дякуємо')
          .and('contain', 'успішно');
      });
    });

    it('submits form (REAL lead) and shows thank-you; verifies Zoho product mapping', () => {
      // REAL test - always runs (creates actual leads in Zoho)
      // Note: This test creates real leads, so use responsibly

      openFromHero();
      assertOpen();
      resetForm();

      // Verify mapping in hidden inputs
      withinModal(() => {
        cy.get('input[name="fields[product_name]"]').should('have.value', page.zoho.productName);
        cy.get('input[name="fields[product_id]"]').should('have.value', page.zoho.productId);
        cy.get('input[name="form_name"]').should('have.value', page.zoho.formName);
        cy.get('.event-data').should('have.attr', 'data-eventvalue', page.zoho.eventValue);
      });

      // Observe real submit (do not stub)
      cy.intercept('POST', '**/wp/wp-admin/admin-post.php').as('leadSubmit');

      fillValidForm();

      getForm().then(($form) => {
        expect($form[0].checkValidity()).to.equal(true);
      });

      withinModal(() => {
        const submitText = page.expected?.submitButtonText || 'Відправити';
        cy.get('button[type="submit"]').contains(submitText, { matchCase: false }).click({ force: true });
      });

      cy.wait('@leadSubmit', { timeout: 30000 }).then((interception) => {
        if (!interception) {
          throw new Error('Form submission was not intercepted - form may not have submitted');
        }

        const { request, response } = interception;
        const body = request.body;

        if (typeof FormData !== 'undefined' && body instanceof FormData) {
          expect(body.get('fields[product_name]'), 'fields[product_name]').to.equal(page.zoho.productName);
          expect(body.get('fields[product_id]'), 'fields[product_id]').to.equal(page.zoho.productId);
          expect(body.get('form_name'), 'form_name').to.equal(page.zoho.formName);
          expect(body.get('action'), 'action').to.equal('zoho_connector_form');
        } else {
          const text = safeBodyText(body) || '';
          expect(text.includes(page.zoho.productName), 'body includes product_name value').to.equal(true);
          expect(text.includes(page.zoho.productId), 'body includes product_id value').to.equal(true);
          expect(text.includes(page.zoho.formName), 'body includes form_name value').to.equal(true);
          expect(text.includes('zoho_connector_form'), 'body includes action value').to.equal(true);
        }

        if (response && typeof response.statusCode === 'number') {
          expect([200, 201, 202, 302, 303], 'submit response status').to.include(response.statusCode);
        }
      });

      // Thank-you state: success message in modal
      // After successful submission, the modal shows a success message
      // Structure: [data-messages] container becomes visible, [data-text-success] becomes visible
      // Wait a bit for the success message to appear after form submission
      cy.wait(2000); // Give time for the success message to render

      withinModal(() => {
        // Wait for success message container to appear (it starts as hidden)
        cy.get('[data-messages]', { timeout: 15000 })
          .should('exist')
          .should('be.visible')
          .should('not.have.class', 'hidden');
        
        // Verify success message element is visible (removes is-hidden class)
        cy.get('[data-text-success]', { timeout: 15000 })
          .should('exist')
          .should('be.visible')
          .should('not.have.class', 'is-hidden');
        
        // Verify success message contains thank-you text
        cy.get('[data-text-success]')
          .should('contain', 'Дякуємо')
          .and('contain', 'успішно');
      });
    });
  });
});


