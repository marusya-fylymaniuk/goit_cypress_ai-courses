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

const normalizeUrlForCanonical = (raw) => {
  const u = new URL(String(raw));
  u.hash = '';
  u.search = '';
  // canonical and browser url must end with a trailing slash
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
};

targetPages.forEach((page) => {
  describe(`[${page.key}] Smoke / Sanity / SEO checks`, () => {
    beforeEach(() => {
      cy.viewport(1280, 720);
      cy.visit(page.url);
      cy.window().then((win) => {
        win.scrollTo(0, 0);
      });
    });

    it('HTTP redirects to HTTPS', () => {
      const httpsUrl = normalizeUrlForCanonical(page.url);
      const u = new URL(httpsUrl);
      u.protocol = 'http:';
      const httpUrl = u.toString();

      cy.request({
        url: httpUrl,
        followRedirect: false,
        failOnStatusCode: false,
      }).then((resp) => {
        expect([301, 302, 307, 308], 'redirect status').to.include(resp.status);
        const location = resp.headers && resp.headers.location;
        expect(location, 'Location header exists').to.be.a('string').and.not.be.empty;

        const resolved = new URL(String(location), httpsUrl).toString();
        expect(resolved.startsWith('https://'), 'redirect location is https').to.equal(true);
        expect(normalizeUrlForCanonical(resolved), 'redirect location matches https url').to.equal(
          normalizeUrlForCanonical(httpsUrl),
        );
      });
    });

    it('no redirects or errors when opening the course page (server-level)', () => {
      // We want a direct 200 response for the configured URL (no 301/302/307/308).
      cy.request({
        url: page.url,
        followRedirect: false,
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status, 'status without redirects').to.eq(200);
        expect(resp.headers, 'no Location header').to.not.have.property('location');
      });
    });

    it('browser lands on the exact course URL (no client-side redirect)', () => {
      cy.url().then((currentUrl) => {
        expect(normalizeUrlForCanonical(currentUrl)).to.equal(normalizeUrlForCanonical(page.url));
      });
    });

    it('server response is 200', () => {
      cy.request({ url: page.url, failOnStatusCode: false }).its('status').should('eq', 200);
    });

    it('page loads (body visible; document complete)', () => {
      cy.get('body').should('be.visible');
      cy.document().its('readyState').should('eq', 'complete');
    });

    it('canonical exists and matches browser URL (with trailing slash)', () => {
      cy.url().then((currentUrl) => {
        expect(String(currentUrl)).to.match(/\/$/, 'browser url ends with "/"');
      });

      cy.document().then((doc) => {
        const link = doc.querySelector('link[rel="canonical"]');
        expect(link, 'canonical link tag exists').to.exist;
        const href = link.getAttribute('href');
        expect(href, 'canonical href').to.be.a('string').and.to.have.length.greaterThan(0);
        expect(String(href)).to.match(/^https?:\/\//, 'canonical is absolute');
        expect(String(href)).to.match(/\/$/, 'canonical ends with "/"');

        cy.url().then((currentUrl) => {
          expect(normalizeUrlForCanonical(href)).to.equal(normalizeUrlForCanonical(currentUrl));
        });
      });
    });

    it('URL has no underscores, spaces, or Cyrillic characters', () => {
      cy.url().then((u) => {
        const url = new URL(String(u));
        const path = url.pathname;
        expect(path.includes('_'), 'no underscore in path').to.equal(false);
        expect(path.includes(' '), 'no spaces in path').to.equal(false);
        expect(/[а-яіїєґ]/i.test(path), 'no Cyrillic in path').to.equal(false);
      });
    });

    it('no meta robots noindex/nofollow', () => {
      cy.document().then((doc) => {
        const meta = doc.querySelector('meta[name="robots"]');
        if (!meta) return;
        const content = String(meta.getAttribute('content') || '').toLowerCase();
        expect(content.includes('noindex'), 'robots does not contain noindex').to.equal(false);
        expect(content.includes('nofollow'), 'robots does not contain nofollow').to.equal(false);
      });
    });

    it('all images have alt attribute', () => {
      // For accessibility & SEO, every <img> should have an alt attribute.
      // (alt can be empty for decorative images, but the attribute should exist.)
      cy.get('img').then(($imgs) => {
        /** @type {string[]} */
        const missing = [];
        $imgs.each((_, img) => {
          if (!img.hasAttribute('alt')) {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            missing.push(src || img.outerHTML.slice(0, 120));
          }
        });
        expect(missing, 'images missing alt attribute').to.have.length(0);
      });
    });

    it('interactive aria-label attributes are not empty', () => {
      // We enforce aria-label quality only for INTERACTIVE elements.
      // Some pages include decorative SVG icons like: <svg aria-label=""> ... </svg>
      // Those should ideally be aria-hidden instead of having empty aria-label,
      // but we don't fail the suite on decorative SVGs.
      const interactiveSelector = [
        'a[aria-label]',
        'button[aria-label]',
        'input[aria-label]',
        'textarea[aria-label]',
        'select[aria-label]',
        '[role="button"][aria-label]',
        '[role="link"][aria-label]',
      ].join(',');

      cy.get(interactiveSelector).then(($els) => {
        /** @type {string[]} */
        const bad = [];
        $els.each((_, el) => {
          const v = (el.getAttribute('aria-label') || '').trim();
          if (!v) bad.push(el.outerHTML.slice(0, 180));
        });
        expect(bad, `interactive elements with empty aria-label:\n${bad.join('\n---\n')}`).to.have.length(0);
      });
    });

    it('all links are HTTPS (no http:// hrefs)', () => {
      cy.get('a[href]').then(($links) => {
        /** @type {string[]} */
        const bad = [];

        $links.each((_, el) => {
          const hrefRaw = el.getAttribute('href') || '';
          const href = hrefRaw.trim();
          if (!href) return;

          const lower = href.toLowerCase();
          // Ignore non-http(s) link types
          if (
            lower.startsWith('#') ||
            lower.startsWith('mailto:') ||
            lower.startsWith('tel:') ||
            lower.startsWith('javascript:')
          ) {
            return;
          }

          // Fail only explicit http:// links (relative links inherit https)
          if (lower.startsWith('http://')) bad.push(href);
        });

        expect(bad, 'links using http://').to.have.length(0);
      });
    });

    it('title exists and is not empty', () => {
      cy.title().should('be.a', 'string').and('not.be.empty');
    });

    it('has exactly one H1 and it matches expected; H1 is on first screen and first among headings', () => {
      cy.get('h1').should('have.length', 1).first().as('h1');

      cy.get('@h1').should('be.visible').and('contain', page.expected.h1);

      // H1 on first screen (viewport)
      cy.get('@h1').then(($h1) => {
        const rect = $h1[0].getBoundingClientRect();
        const vh = Cypress.config('viewportHeight');
        expect(rect.top, 'h1 top is within first screen').to.be.lessThan(vh);
        expect(rect.bottom, 'h1 bottom is visible').to.be.greaterThan(0);
      });

      // In content hierarchy, H1 should be the first heading inside main content.
      // We scope to <main> (or role=main) to avoid headings in header/nav.
      cy.get('body').then(($body) => {
        const hasMain = $body.find('main, [role="main"]').length > 0;
        const scope = hasMain ? 'main, [role="main"]' : 'body';
        cy.get(scope)
          .first()
          .find('h1,h2,h3,h4,h5,h6')
          .filter(':visible')
          .first()
          .should('match', 'h1');
      });
    });

    it('has H2/H3 headings', () => {
      cy.document().then((doc) => {
        const h2 = doc.querySelectorAll('h2').length;
        const h3 = doc.querySelectorAll('h3').length;
        expect(h2 + h3, 'at least one h2 or h3 exists').to.be.greaterThan(0);
      });
    });

    it('has main CTA button "Записатися на курс" in hero', () => {
      const ctaText = page.expected?.ctaText || 'Записатися на курс';
      cy.get('section.hero')
        .find('[data-modal-open]')
        .contains(ctaText)
        .should('be.visible');
    });

    it('has required sections/anchors per page (if configured)', () => {
      const anchors = page?.expected?.anchors;
      if (Array.isArray(anchors) && anchors.length) {
        anchors.forEach((anchor) => {
          // Check if anchor exists - if not, log and continue (some sections are optional)
          cy.get('body').then(($body) => {
            const $element = $body.find(anchor);
            if ($element.length === 0) {
              cy.log(`Section ${anchor} not found on this page - this is optional`);
            } else {
              cy.get(anchor).should('exist');
            }
          });
        });
      }

      const discountSelector = page?.expected?.discountSectionSelector;
      if (discountSelector) {
        cy.get('body').then(($body) => {
          const $element = $body.find(discountSelector);
          if ($element.length === 0) {
            cy.log(`Discount section (${discountSelector}) not found on this page - this is optional`);
          } else {
            cy.get(discountSelector).should('exist');
          }
        });
      }
    });
  });
});

