import React from 'react';
import { render, screen } from '@testing-library/react';
import { getByText, getByTestId } from '@testing-library/dom';
import MohioTreeElementMultiLevel from './MohioTreeElementMultiLevel';
import { testId as MohioTreeElementMultiLevelTestId } from './MohioTreeElementMultiLevel';

const name = 'MohioTreeElementMultiLevel';
const childrenOfChildren = [
  { name: 'Child-1-1' },
  { name: 'Child-1-2' },
];
const children = [
  { name: 'Child-1', children: childrenOfChildren },
  { name: 'Child-2' },
];

beforeEach(() => {
  render(<MohioTreeElementMultiLevel name={name} children={children} />);
});

test('displays the name', () => {
  const element = screen.getByText(name);
  expect(element).toBeInTheDocument();
});

test('displays the name and the children within the same list', () => {
  const listElements = screen.getAllByTestId(MohioTreeElementMultiLevelTestId);
  const listElement = listElements[0];
  const element = screen.getByText(name);
  expect(element).toBeInTheDocument();
  for (let child of children) {
    const childElement = getByText(listElement, child.name);
    expect(childElement).toBeInTheDocument();
  }
});


test('displays the children of children', () => {
  const listElements = screen.getAllByTestId(MohioTreeElementMultiLevelTestId);
  const listElementParent = listElements[0];
  const listElementChild = getByTestId(listElementParent, MohioTreeElementMultiLevelTestId)
  for (let child of childrenOfChildren) {
    const childElement = getByText(listElementChild, child.name);
    expect(childElement).toBeInTheDocument();
  }
});
