import React from 'react';
import { getByText, fireEvent } from '@testing-library/dom';

import { Given, When, Then } from './App.bdd';

const defaultMohioName = 'About';
const toSelectFirstLevelMohioName = 'Domain';
const toSelectSecondLevelMohioName = 'Bar';
const toSelectSecondLevelOtherMohioName = 'Tree';

test('given mohios created in repopsitory and app rendered with store then mohio tree is displayed', async () => {
  await Given.MohiosCreatedInRepository();
  await Given.AppIsRenderedWithStore();
  return Then.MohiosTreeIsDisplayed();
});

test('clicking on domain will show the domain mohio (hard coded data)', () => {

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


