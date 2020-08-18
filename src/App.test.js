import React from 'react';
import { renderWithStore } from "./util/reduxUtil";
import { getByText, fireEvent } from '@testing-library/dom';
import App from './App';

const defaultMohioName = 'About';
const toSelectFirstLevelMohioName = 'Domain';
const toSelectSecondLevelMohioName = 'Bar';
const toSelectSecondLevelOtherMohioName = 'Tree';
let app;

beforeEach(() => {
  const { container } = renderWithStore(<App />);
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
  const toSelectFirstLevelMohioNavigationElement = getByText(mohioTreeElement, toSelectFirstLevelMohioName);
  fireEvent.click(toSelectFirstLevelMohioNavigationElement);
  const mohioViewElement = getMohioViewElement();
  const nameElement = getByText(mohioViewElement, toSelectFirstLevelMohioName);
  expect(nameElement).toBeInTheDocument();
});


test('clicking on other child of domain will show the other child of domain mohio (hard coded data)', () => {
  const mohioTreeElement = getMohioTreeElement();
  const toSelectFirstLevelMohioNavigationElement = getByText(mohioTreeElement, toSelectFirstLevelMohioName);
  fireEvent.click(toSelectFirstLevelMohioNavigationElement);
  const toSelectSecondLevelMohioNavigationElement = getByText(mohioTreeElement, toSelectSecondLevelMohioName);
  fireEvent.click(toSelectSecondLevelMohioNavigationElement);
  const mohioViewElement = getMohioViewElement();
  const nameElement = getByText(mohioViewElement, toSelectSecondLevelMohioName);
  expect(nameElement).toBeInTheDocument();
});

test('clicking on 2nd child of domain will show the child of domain mohio (hard coded data)', () => {
  const mohioTreeElement = getMohioTreeElement();
  const toSelectFirstLevelMohioNavigationElement = getByText(mohioTreeElement, toSelectFirstLevelMohioName);
  fireEvent.click(toSelectFirstLevelMohioNavigationElement);
  const toSelectSecondLevelMohioNavigationElement = getByText(mohioTreeElement, toSelectSecondLevelMohioName);
  fireEvent.click(toSelectSecondLevelMohioNavigationElement);
  const toSelectSecondLevelOtherMohioNavigationElement = getByText(mohioTreeElement, toSelectSecondLevelOtherMohioName);
  fireEvent.click(toSelectSecondLevelOtherMohioNavigationElement);
  const mohioViewElement = getMohioViewElement();
  const nameElement = getByText(mohioViewElement, toSelectSecondLevelOtherMohioName);
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