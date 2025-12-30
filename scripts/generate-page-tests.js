#!/usr/bin/env node

/**
 * Script to generate page-specific test files from existing test files
 * 
 * This script:
 * 1. Reads all test files from cypress/e2e/
 * 2. Extracts tests for each page
 * 3. Combines them into page-specific files in cypress/e2e/pages/
 */

const fs = require('fs');
const path = require('path');

const PAGES_JSON = path.join(__dirname, '../cypress/fixtures/pages.json');
const E2E_DIR = path.join(__dirname, '../cypress/e2e');
const PAGES_DIR = path.join(__dirname, '../cypress/e2e/pages');
const HELPERS_FILE = path.join(__dirname, '../cypress/e2e/pages/_helpers.js');

// Test file order (matching the current structure)
const TEST_FILES = [
  '01-smoke-sanity.cy.js',
  '02-header-navigation.cy.js',
  '03-language-switcher.cy.js',
  '04-hero-block.cy.js',
  '05-modal-form.cy.js',
  '06-benefits-section.cy.js',
  '07-about-section.cy.js',
  '08-course-program.cy.js',
  '09-learning-format.cy.js',
  '10-reviews.cy.js',
  '11-pricing-section.cy.js',
  '12-footer.cy.js',
  '13-analytics-datalayer.cy.js',
  '14-responsive-cross-browser.cy.js',
  '15-accessibility.cy.js',
  '16-discount-section.cy.js',
];

// Test case names (for describe blocks)
const TEST_CASE_NAMES = {
  '01-smoke-sanity.cy.js': 'Smoke / Sanity / SEO checks',
  '02-header-navigation.cy.js': 'Header / Menu / Navigation',
  '03-language-switcher.cy.js': 'Language switcher / Localization',
  '04-hero-block.cy.js': 'Hero block',
  '05-modal-form.cy.js': 'Modal "Записатися на курс" (форма)',
  '06-benefits-section.cy.js': 'Benefits section (#benefits)',
  '07-about-section.cy.js': 'About section (#about)',
  '08-course-program.cy.js': 'Course program (#program) - accordion',
  '09-learning-format.cy.js': 'Learning format (#format)',
  '10-reviews.cy.js': 'Reviews (#reviews)',
  '11-pricing-section.cy.js': 'Pricing section',
  '12-footer.cy.js': 'Footer',
  '13-analytics-datalayer.cy.js': 'Analytics / dataLayer',
  '14-responsive-cross-browser.cy.js': 'Responsive / Cross-browser checks',
  '15-accessibility.cy.js': 'Accessibility checks',
  '16-discount-section.cy.js': 'Discount section',
};

function readPages() {
  const content = fs.readFileSync(PAGES_JSON, 'utf8');
  return JSON.parse(content);
}

function readTestFile(filename) {
  const filePath = path.join(E2E_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filename} not found`);
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

function extractTestsForPage(testContent, pageKey) {
  if (!testContent) return null;

  // Find the describe block for this page
  const pagePattern = new RegExp(
    `describe\\([^)]*\\[${pageKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\][^)]*\\)[^}]*\\{([\\s\\S]*?)(?=describe|\\s*\\}\\);?\\s*\\}\\);?$)`,
    'g'
  );

  const matches = [...testContent.matchAll(pagePattern)];
  if (matches.length === 0) {
    // Try to find tests that use targetPages.forEach
    const forEachPattern = /targetPages\.forEach\([^)]*page[^)]*\)\s*\{([\s\S]*?)\}\s*\}\);?/g;
    const forEachMatch = [...testContent.matchAll(forEachPattern)];
    if (forEachMatch.length > 0) {
      // Extract the test content inside forEach
      return forEachMatch[0][1];
    }
    return null;
  }

  return matches.map(m => m[1]).join('\n');
}

function generatePageTestFile(page) {
  const pageKey = page.key;
  const pageName = page.name;
  
  let content = `/// <reference types="cypress" />

/**
 * All tests for: ${pageName}
 * URL: ${page.url}
 * 
 * This file contains all test cases for this page.
 * Page is opened once, then all tests run on it.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pages = require('../../fixtures/pages.json');
const { normalizeUrlForCanonical, getModalHelpers, TEST_LEAD, safeBodyText } = require('./_helpers');

// Get page data
const page = pages.find(p => p.key === '${pageKey}');
if (!page) {
  throw new Error('Page ${pageKey} not found in pages.json');
}

describe('${pageName} - All Tests', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit(page.url);
    cy.window().then((win) => {
      win.scrollTo(0, 0);
    });
  });

`;

  // Add tests from each test file
  for (const testFile of TEST_FILES) {
    const testContent = readTestFile(testFile);
    if (!testContent) continue;

    const testCaseName = TEST_CASE_NAMES[testFile] || testFile.replace('.cy.js', '');
    
    content += `  // ============================================\n`;
    content += `  // ${testCaseName}\n`;
    content += `  // Source: ${testFile}\n`;
    content += `  // ============================================\n`;
    content += `  describe('${testCaseName}', () => {\n`;

    // Extract tests for this page
    const pageTests = extractTestsForPage(testContent, pageKey);
    
    if (pageTests) {
      // Clean up the extracted content
      let cleanedTests = pageTests
        .replace(/targetPages\.forEach\([^)]*\)\s*\{/g, '')
        .replace(/describe\([^)]*\)\s*\{/g, '')
        .replace(/beforeEach\([^)]*\)\s*\{[\s\S]*?\}\s*;/g, '') // Remove beforeEach from extracted content
        .trim();

      // Add indentation
      cleanedTests = cleanedTests
        .split('\n')
        .map(line => '    ' + line)
        .join('\n');

      content += cleanedTests;
    } else {
      // If we can't extract, try to include the whole test file logic
      // This is a fallback - we'll need to manually adjust
      content += `    // Note: Tests from ${testFile} need to be manually integrated\n`;
      content += `    // Original file uses targetPages.forEach - extract tests manually\n`;
    }

    content += `\n  });\n\n`;
  }

  content += `});\n`;

  return content;
}

function main() {
  console.log('🚀 Generating page-specific test files...\n');

  // Ensure pages directory exists
  if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR, { recursive: true });
  }

  // Read pages
  const pages = readPages();
  console.log(`Found ${pages.length} pages\n`);

  // Generate file for each page
  for (const page of pages) {
    console.log(`Generating tests for: ${page.name} (${page.key})...`);
    const content = generatePageTestFile(page);
    const outputPath = path.join(PAGES_DIR, `${page.key}.cy.js`);
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`  ✅ Created: ${outputPath}\n`);
  }

  console.log('✨ Done! Generated', pages.length, 'page test files');
  console.log('\n⚠️  Note: Generated files may need manual adjustments');
  console.log('   Please review and test each file before using in production');
}

if (require.main === module) {
  main();
}

module.exports = { generatePageTestFile, extractTestsForPage };



