# E2E Tests for AI Automator Course Page

This project contains end-to-end tests for the AI Automator course page using Cypress.

## 📚 Для новичков

Если ты только начинаешь изучать JavaScript и Cypress, обязательно прочитай:
- **[EXPLANATION.md](./EXPLANATION.md)** — детальное объяснение всего кода простым языком
- **[VISUAL_EXAMPLES.md](./VISUAL_EXAMPLES.md)** — визуальные примеры и схемы для понимания
- **[ALL_TESTS_EXPLAINED.md](./ALL_TESTS_EXPLAINED.md)** — **ДЕТАЛЬНЕ ПОЯСНЕННЯ ВСІХ ПЕРЕВІРОК** простими словами для повних новачків (що перевіряє кожен тест, навіщо, як працює)
- **[LANGUAGE_SWITCHER_EXPLANATION.md](./LANGUAGE_SWITCHER_EXPLANATION.md)** — детальное объяснение тест-кейсу #3 (Language switcher) простыми словами
- **[RU_LOCALE_TESTING_GUIDE.md](./RU_LOCALE_TESTING_GUIDE.md)** — гайд по тестуванию російської локалі (ua-ru) по всім тест-кейсам

## Base URL
`https://goit.global/ua/courses/ai-marketing-specialist/`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Open Cypress Test Runner:
```bash
npm run cy:open
```

3. Run tests in headless mode:
```bash
npm run cy:run
```

## Test Structure

Tests are organized by test case categories:

- `01-smoke-sanity.cy.js` - Smoke and sanity tests
- `02-header-navigation.cy.js` - Header, menu, and navigation tests
- `03-language-switcher.cy.js` - Language switcher / Localization tests
- `04-hero-block.cy.js` - Hero block tests
- `05-modal-form.cy.js` - Modal "Записатися на курс" (form) tests
- `06-benefits-section.cy.js` - Benefits section (#benefits) tests
- `07-about-section.cy.js` - About section (#about) tests
- `08-course-program.cy.js` - Course program (#program) - accordion tests
- `09-learning-format.cy.js` - Learning format (#format) tests
- `10-reviews.cy.js` - Reviews (#reviews) tests
- `11-pricing-section.cy.js` - Pricing section tests
- `12-footer.cy.js` - Footer tests
- `13-analytics-datalayer.cy.js` - Analytics / dataLayer tests
- `14-responsive-cross-browser.cy.js` - Responsive / Cross-browser tests
- `15-accessibility.cy.js` - Accessibility tests

## Test Cases Coverage

1. ✅ Smoke / Sanity
2. ✅ Header / Menu / Navigation
3. ✅ Language switcher / Localization
4. ✅ Hero block
5. ✅ Modal "Записатися на курс" (form)
6. ✅ Benefits section (#benefits)
7. ✅ About section (#about)
8. ✅ Course program (#program) - accordion
9. ✅ Learning format (#format)
10. ✅ Reviews (#reviews)
11. ✅ Pricing section
12. ✅ Footer
13. ✅ Analytics / dataLayer
14. ✅ Responsive / Cross-browser
15. ✅ Accessibility

## Browser Support

**Supported browsers in Cypress:**
- ✅ Chrome (default)
- ✅ Firefox
- ✅ Edge (Chromium-based)
- ✅ Electron

**Not supported:**
- ❌ Safari (Cypress does not support Safari)

**Note:** For Safari testing, consider using Playwright or Selenium WebDriver as alternative tools.

## Running Specific Tests

```bash
# Run smoke tests only
npm run test:smoke

# Run header tests only
npm run test:header

# Run language switcher tests only
npm run test:language

# Run modal tests (safe: no real lead creation)
npm run test:modal

# Run modal tests WITH real lead creation (opt-in)
# WARNING: This will create a real lead on the backend.
npm run test:modal:real

# Run hero tests only
npm run test:hero

# Run benefits section tests only
npm run test:benefits

# Run about section tests only
npm run test:about

# Run course program tests only
npm run test:program

# Run learning format tests only
npm run test:format

# Run reviews tests only
npm run test:reviews

# Run pricing section tests only
npm run test:pricing

# Run footer tests only
npm run test:footer

# Run analytics tests only
npm run test:analytics

# Run responsive / cross-browser tests only
npm run test:responsive

# Run accessibility tests only
npm run test:accessibility

# Cross-browser testing (Firefox)
# Note: Safari is not supported by Cypress. Use Firefox for cross-browser testing.
npm run test:firefox              # Run all tests in Firefox
npm run test:firefox:smoke        # Run smoke tests in Firefox
npm run test:firefox:header        # Run header tests in Firefox
npm run test:firefox:modal         # Run modal tests in Firefox

# Run tests for Ukrainian locale only
npm run test:ua

# Run tests for Russian locale only
npm run test:ru

# Run specific test case for Ukrainian locale
npm run test:smoke:ua
npm run test:header:ua
npm run test:language:ua
npm run test:hero:ua
npm run test:benefits:ua
npm run test:about:ua
npm run test:program:ua
npm run test:format:ua
npm run test:reviews:ua
npm run test:pricing:ua
npm run test:footer:ua
npm run test:analytics:ua
npm run test:responsive:ua
npm run test:accessibility:ua
npm run test:modal:ua

# Run specific test case for Russian locale
npm run test:smoke:ru
npm run test:header:ru
npm run test:language:ru
npm run test:hero:ru
npm run test:benefits:ru
npm run test:about:ru
npm run test:program:ru
npm run test:format:ru
npm run test:reviews:ru
npm run test:pricing:ru
npm run test:footer:ru
npm run test:analytics:ru
npm run test:responsive:ru
npm run test:accessibility:ru
npm run test:modal:ru
```

