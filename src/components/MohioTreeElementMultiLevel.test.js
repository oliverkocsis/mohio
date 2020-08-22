import React from 'react';
import { renderWithStore } from '../util/reduxUtil';
import { screen } from '@testing-library/react';
import { getByText, fireEvent } from '@testing-library/dom';
import MohioTreeElementMultiLevel from './MohioTreeElementMultiLevel';
import { testId as MohioTreeElementMultiLevelTestId } from './MohioTreeElementMultiLevel';

const name = 'MohioTreeElementMultiLevel';
const childName = 'Child-1'
const childOfChildrenName = 'Child-1-1';
const childrenOfChildren = [
  { name: childOfChildrenName },
  { name: 'Child-1-2' },
];
const children = [
  { name: childName, children: childrenOfChildren },
  { name: 'Child-2' },
];

beforeEach(() => {
  renderWithStore(<MohioTreeElementMultiLevel name={name} children={children} onClick={() => { }} />);
});

test('displays the name', () => {
  const parentElement = getParentElement();
  expect(parentElement).toBeInTheDocument();
});

test('does not display children by default', () => {
  const allLevelChdilrenElements = screen.getByTestId(MohioTreeElementMultiLevelTestId);
  expect(allLevelChdilrenElements).toBeInTheDocument();
});

test('displays the first level children after clicking on the parent element', () => {
  clickOnParentElement();
  for (let child of children) {
    const childElement = screen.getByText(child.name);
    expect(childElement).toBeInTheDocument();
  }
  for (let child of childrenOfChildren) {
    const childElement = screen.queryByText(child.name);
    expect(childElement).toBeNull();
  }
});

test('displays the second level children after clicking on the parent element then the first level child-parent element', () => {
  clickOnParentElement();
  clickOnChildElement();
  const secondLevelChdilrenElements = getSecondLevelChildrenElements();
  for (let child of childrenOfChildren) {
    const childElement = getByText(secondLevelChdilrenElements, child.name);
    expect(childElement).toBeInTheDocument();
  }
  for (let child of children) {
    const childElement = screen.getByText(child.name);
    expect(childElement).toBeInTheDocument();
  }
});

test('does not display the first level children after clicking on the parent element twice', (done) => {
  clickOnParentElement();
  clickOnParentElement();
  // wait for animation ends on closing the list
  setTimeout(() => {
    try {
      for (let child of children) {
        const childElement = screen.queryByText(child.name);
        expect(childElement).toBeNull();
      }
      for (let child of childrenOfChildren) {
        const childElement = screen.queryByText(child.name);
        expect(childElement).toBeNull();
      }
      done();
    } catch (error) {
      done(error);
    }

  }, 2500);

});

function getParentElement() {
  return screen.getByText(name);
}

function clickOnParentElement() {
  const parentElement = getParentElement();
  fireEvent.click(parentElement);
}

function getChildelement() {
  return screen.getByText(childName);
}

function clickOnChildElement() {
  const parentOfSecondLevelChildrenElements = getChildelement();
  fireEvent.click(parentOfSecondLevelChildrenElements);
}

function getSecondLevelChildrenElements() {
  const allMohioTreeElementMultiLevel = screen.getAllByTestId(MohioTreeElementMultiLevelTestId);
  return allMohioTreeElementMultiLevel[1];
}