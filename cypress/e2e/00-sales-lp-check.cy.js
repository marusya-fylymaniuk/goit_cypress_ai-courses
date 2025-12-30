/// <reference types="cypress" />

describe('Sales LP Status Check', () => {
  const url = 'https://sales-lp-ua.goit.global/';

  it('should load the page with status 200', () => {
    cy.request({
      url: url,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
    });
  });

  it('should visit the page successfully', () => {
    cy.visit(url);
    cy.url().should('include', 'sales-lp-ua.goit.global');
    cy.get('body').should('be.visible');
  });
});

