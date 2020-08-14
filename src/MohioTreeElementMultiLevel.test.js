import React from 'react';
import { render, screen } from '@testing-library/react';
import { getByText, getByTestId, fireEvent } from '@testing-library/dom';
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
  render(<MohioTreeElementMultiLevel name={name} children={children} />);
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
});

test('displays the second level children after clicking on the parent element then the first level child-parent element', () => {
  clickOnParentElement();
  clickOnChildElement();
  const secondLevelChdilrenElements = getSecondLevelChildrenElements();
  for (let child of childrenOfChildren) {
    const childElement = getByText(secondLevelChdilrenElements, child.name);
    expect(childElement).toBeInTheDocument();
  }
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