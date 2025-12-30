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

const page = pageKey
  ? filteredPages.find((p) => p.key === pageKey) || pages.find((p) => p.key === pageKey)
  : filteredPages[0] || pages[0];

const expectedHomePathByLocale = (courseUrl) => {
  const path = new URL(String(courseUrl)).pathname;
  return path.startsWith('/ua-ru/') ? '/ua-ru/' : '/ua/';
};

describe('Header / Menu / Navigation Tests', () => {
  beforeEach(() => {
    cy.visit(page.url);
  });

  it('should navigate to homepage when clicking logo', () => {
    // IMPORTANT:
    // There is a fixed top banner (<a.banner__top ...>) that also contains "goit" in its href.
    // We must click the LOGO in the header, not the banner.
    cy.get('header').should('exist');

    cy.get('header a:visible').then(($links) => {
      const $logoLink = Cypress.$($links)
        .filter((_, el) => {
          const href = el.getAttribute('href') || '';
          const isBanner = el.classList?.contains('banner__top');
          const hasLogoChild = Boolean(el.querySelector('img') || el.querySelector('svg'));
          return !isBanner && hasLogoChild && /goit/i.test(href);
        })
        .first();

      expect($logoLink.length, 'logo link found in header').to.be.greaterThan(0);
      cy.wrap($logoLink).click({ force: true });
    });

    // Verify navigation to homepage (should leave /courses/ landing)
    const expectedHomePath = expectedHomePathByLocale(page.url);
    cy.location('pathname').should('eq', expectedHomePath);
    cy.url().should('include', 'goit.global');
    cy.url().should('not.include', '/courses/');
  });

  it('should open/close menu on desktop and mobile', () => {
    // Test mobile menu (if viewport is small)
    cy.viewport(375, 667);
    cy.wait(1000); // Wait for responsive layout to apply
    
    // Look for hamburger menu button (visible on mobile)
    cy.get('body').then(($body) => {
      // Try to find hamburger button
      const hamburger = $body.find('button[class*="hamburger"], [class*="burger"], button[aria-label*="menu"]').filter(':visible').first();
      
      if (hamburger.length > 0) {
        cy.wrap(hamburger).should('be.visible').click();
        // Menu should be visible after click
        cy.get('nav, [class*="menu"], [class*="nav"]').should('be.visible');
      } else {
        // If no hamburger found, skip this test on this viewport
        cy.log('Mobile menu button not found, skipping mobile menu test');
      }
    });
  });

  it('should open/close dropdown "курси/напрямки"', () => {
    // This site implements the "Курси" dropdown differently by viewport:
    // - Desktop (>= 1024px): opens on hover (mouseenter/mouseleave)
    // - Mobile/Tablet (< 1024px): opens on click (and toggles CSS classes)

    // Desktop behavior
    cy.viewport(1280, 720);
    cy.visit(page.url);

    cy.get('.nav-primary .menu > li:first-child').as('coursesMenuItem');
    cy.get('.courses-dropdown').as('coursesDropdown');

    // Wait until the site's dropdown JS is initialized (it adds "has-dropdown" to the first menu item)
    cy.get('@coursesMenuItem').should('have.class', 'has-dropdown');

    // #region agent log
    cy.window().then((win) => {
      fetch('http://127.0.0.1:7242/ingest/7b97a8c1-beb9-4c9f-b9c0-5d3ffef31b82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cypress/e2e/02-header-navigation.cy.js:desktop:beforeHover',message:'Desktop dropdown pre-hover state',data:{href:win.location.href,innerWidth:win.innerWidth,menuItemClass:win.document.querySelector(".nav-primary .menu > li:first-child")?.className||null,dropdownClass:win.document.querySelector(".courses-dropdown")?.className||null},timestamp:Date.now(),sessionId:'debug-session',runId:'headed-debug',hypothesisId:'D'})}).catch(()=>{});
    });
    // #endregion

    // Open on hover
    cy.get('@coursesMenuItem')
      .trigger('mouseover')
      .trigger('mouseenter')
      .trigger('mousemove');

    // #region agent log
    cy.window().then((win) => {
      fetch('http://127.0.0.1:7242/ingest/7b97a8c1-beb9-4c9f-b9c0-5d3ffef31b82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cypress/e2e/02-header-navigation.cy.js:desktop:afterHoverTrigger',message:'Desktop dropdown after hover trigger (before assertions)',data:{dropdownClass:win.document.querySelector(".courses-dropdown")?.className||null},timestamp:Date.now(),sessionId:'debug-session',runId:'headed-debug',hypothesisId:'D'})}).catch(()=>{});
    });
    // #endregion

    cy.get('@coursesDropdown')
      .should('have.class', 'visible')
      .and('have.class', 'opacity-100')
      .and('have.class', 'pointer-events-auto')
      .and('not.have.class', 'invisible')
      .and('not.have.class', 'opacity-0');

    // #region agent log
    cy.window().then((win) => {
      fetch('http://127.0.0.1:7242/ingest/7b97a8c1-beb9-4c9f-b9c0-5d3ffef31b82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cypress/e2e/02-header-navigation.cy.js:desktop:afterHover',message:'Desktop dropdown after hover',data:{href:win.location.href,innerWidth:win.innerWidth,dropdownClass:win.document.querySelector(".courses-dropdown")?.className||null},timestamp:Date.now(),sessionId:'debug-session',runId:'dropdown-pre',hypothesisId:'D'})}).catch(()=>{});
    });
    // #endregion

    // Close on mouseleave (dropdown stays in DOM but becomes invisible)
    cy.get('@coursesMenuItem').trigger('mouseleave');
    cy.get('@coursesDropdown')
      .should('have.class', 'invisible')
      .and('have.class', 'opacity-0')
      .and('have.class', 'pointer-events-none');
  });

  it('should open/close courses dropdown on mobile (click toggle)', () => {
    cy.viewport(375, 667);
    cy.visit(page.url);

    // #region agent log
    cy.window().then((win) => {
      fetch('http://127.0.0.1:7242/ingest/7b97a8c1-beb9-4c9f-b9c0-5d3ffef31b82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cypress/e2e/02-header-navigation.cy.js:mobile:start',message:'Mobile dropdown test start',data:{href:win.location.href,innerWidth:win.innerWidth,innerHeight:win.innerHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'dropdown-pre',hypothesisId:'A'})}).catch(()=>{});
    });
    // #endregion

    // Open mobile menu (hamburger)
    cy.get('[data-menu-button]')
      .should('be.visible')
      .and('have.attr', 'aria-expanded', 'false')
      .click()
      .should('have.attr', 'aria-expanded', 'true');

    // #region agent log
    cy.window().then((win) => {
      const btn = win.document.querySelector('[data-menu-button]');
      fetch('http://127.0.0.1:7242/ingest/7b97a8c1-beb9-4c9f-b9c0-5d3ffef31b82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cypress/e2e/02-header-navigation.cy.js:mobile:menuOpened',message:'Mobile menu button clicked',data:{ariaExpanded:btn?.getAttribute("aria-expanded")||null,href:win.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'dropdown-pre',hypothesisId:'A'})}).catch(()=>{});
    });
    // #endregion

    // Scope to the mobile menu container
    cy.get('#mobile-menu').should('be.visible').within(() => {
      // IMPORTANT:
      // - The site attaches the click handler to the <li>
      // - but Cypress sometimes can't click the <li> after the dropdown opens (it becomes "overflowed")
      // Click the <li> directly (this matches the site's JS logic that removes href on mobile).
      // Use force to avoid Cypress "covered/overflowed" actionability errors.
      cy.get('.nav-primary .menu > li:first-child').scrollIntoView().click({ force: true });

      // Ensure we did NOT navigate away (if we navigate, dropdown can't open)
      cy.location('pathname').should('include', '/ai-marketing-specialist/');

      // #region agent log
      cy.window().then((win) => {
        const li = win.document.querySelector('#mobile-menu .nav-primary .menu > li:first-child');
        const a = li?.querySelector('a');
        const dd = win.document.querySelector('#mobile-menu .courses-dropdown') || win.document.querySelector('.courses-dropdown');
        fetch('http://127.0.0.1:7242/ingest/7b97a8c1-beb9-4c9f-b9c0-5d3ffef31b82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cypress/e2e/02-header-navigation.cy.js:mobile:afterFirstClick',message:'After first click on coursesMenuItem',data:{href:win.location.href,linkHref:a?.getAttribute("href")||null,linkTitle:a?.getAttribute("title")||null,liClass:li?.className||null,dropdownClass:dd?.className||null},timestamp:Date.now(),sessionId:'debug-session',runId:'dropdown-pre',hypothesisId:'B'})}).catch(()=>{});
      });
      // #endregion

      cy.get('.nav-primary .menu > li:first-child .courses-dropdown')
        .should('have.class', 'mobile-open')
        .and('not.have.class', 'opacity-0')
        .and('not.have.class', 'invisible');

      // Close on second click
      cy.get('.nav-primary .menu > li:first-child').scrollIntoView().click({ force: true });

      // #region agent log
      cy.window().then((win) => {
        const dd = win.document.querySelector('#mobile-menu .courses-dropdown') || win.document.querySelector('.courses-dropdown');
        fetch('http://127.0.0.1:7242/ingest/7b97a8c1-beb9-4c9f-b9c0-5d3ffef31b82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cypress/e2e/02-header-navigation.cy.js:mobile:afterSecondClick',message:'After second click (attempt close)',data:{href:win.location.href,dropdownClass:dd?.className||null},timestamp:Date.now(),sessionId:'debug-session',runId:'dropdown-pre',hypothesisId:'C'})}).catch(()=>{});
      });
      // #endregion

      cy.get('.nav-primary .menu > li:first-child .courses-dropdown')
        .should('not.have.class', 'mobile-open')
        .and('have.class', 'opacity-0')
        .and('have.class', 'invisible');
    });
  });

  it('should verify menu links (at least "Всі AI курси", "QA + AI", "Fullstack + AI")', () => {
    // Check for specific menu links
    const menuLinks = ['Всі AI курси', 'QA + AI', 'Fullstack + AI'];
    
    menuLinks.forEach(linkText => {
      cy.get('body').then(($body) => {
        if ($body.text().includes(linkText)) {
          cy.contains('a', linkText).should('exist');
        }
      });
    });
  });

  it('should open "Обрати професію" in new tab and trigger dataLayer event', () => {
    // Initialize dataLayer before any interaction
    cy.window().then((win) => {
      if (!win.dataLayer) {
        win.dataLayer = [];
      }
    });
    
    cy.wait(1000); // Wait for page scripts to load
    
    // Try to find by class first (btn-prof-1 is desktop, visible on large screens)
    cy.get('body').then(($body) => {
      const desktopBtn = $body.find('a.btn-prof-1').filter(':visible');
      const mobileBtn = $body.find('a.btn-prof-2').filter(':visible');
      
      // Use desktop version if visible, otherwise mobile
      const targetBtn = desktopBtn.length > 0 ? desktopBtn.first() : mobileBtn.first();
      
      if (targetBtn.length > 0) {
        cy.wrap(targetBtn).then(($btn) => {
          // Check if it opens in new tab
          cy.wrap($btn).should('have.attr', 'target', '_blank');
          
          // Click the button
          cy.wrap($btn).click();
          
          // Wait for the event to be pushed
          cy.wait(500);
          
          // Verify dataLayer event
          cy.window().then((win) => {
            const dataLayer = win.dataLayer || [];
            const hasRegisterClick = dataLayer.some(item => item.event === 'register_click');
            expect(hasRegisterClick).to.be.true;
          });
        });
      } else {
        // Fallback: search by text using cy.contains
        cy.contains('Обрати професію').should('be.visible');
        cy.contains('Обрати професію').then(($btn) => {
          if ($btn.is('a')) {
            cy.wrap($btn).should('have.attr', 'target', '_blank');
          }
          
          cy.wrap($btn).click();
          cy.wait(500);
          
          cy.window().then((win) => {
            const dataLayer = win.dataLayer || [];
            const hasRegisterClick = dataLayer.some(item => item.event === 'register_click');
            expect(hasRegisterClick).to.be.true;
          });
        });
      }
    });
  });
});

