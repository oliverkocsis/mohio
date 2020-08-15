import React from 'react';
import { render, screen, QueryBy } from '@testing-library/react';
import { getByText, fireEvent } from '@testing-library/dom';
import App from './App';



const defaultMohioName = 'About';
const toSelectMohioName = 'Domain';
let app;

beforeEach(() => {
  const { container } = render(<App />);
  app = container;
  app.querySelector('nav');
});

test('by default the about mohio is displayed (hard coded data)', () => {
  const mohioViewElement = getMohioViewElement();
  const nameElement = getByText(mohioViewElement, defaultMohioName);
  expect(nameElement).toBeInTheDocument();
});

test('clicking on domain will show the domain mohio (hard coded data)', () => {
  const mohioTreeElement = getMohioTreeElement();
  const toSelectMohioNavigationElement = getByText(mohioTreeElement, toSelectMohioName);
  fireEvent.click(toSelectMohioNavigationElement);
  const mohioViewElement = getMohioViewElement();
  const nameElement = getByText(mohioViewElement, toSelectMohioName);
  expect(nameElement).toBeInTheDocument();
});

function getMohioTreeElement() {
  const MohioTreeRootElement = 'nav';
  return app.querySelector(MohioTreeRootElement);
}

function getMohioViewElement() {
  const MohioViewRootElement = 'main';
  return app.querySelector(MohioViewRootElement);
}