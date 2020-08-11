import React from 'react';
import { render, screen } from '@testing-library/react';
import { getByText } from '@testing-library/dom';
import MohioTreeElementMultiLevel from './MohioTreeElementMultiLevel';
import { testId as MohioTreeElementMultiLevelTestId } from './MohioTreeElementMultiLevel';

const name = 'MohioTreeElementMultiLevel';
const children = [
  { name: 'MohioTreeElementMultiLevelChild1' },
  { name: 'MohioTreeElementMultiLevelChild2' },
];

beforeEach(() => {
  render(<MohioTreeElementMultiLevel name={name} children={children} />);
});

test('displays the name', () => {
  const element = screen.getByText(name);
  expect(element).toBeInTheDocument();
});

test('displays the name and the children within the same list', () => {
  const listElement = screen.getByTestId(MohioTreeElementMultiLevelTestId);
  const element = screen.getByText(name);
  expect(element).toBeInTheDocument();
  for (let child of children) {
    const childElement = getByText(listElement, child.name);
    expect(childElement).toBeInTheDocument();
  }
});


xtest('displays the children and the children of children', () => {
  const testChild = (parent, child) => {
    if (typeof child === 'string') {
      const childElement = screen.getByText(child);
      expect(childElement).toBeInTheDocument();
      expect(parent).toContainElement(childElement);
    } else {
      for (let childChild of child.children) {
        const titleElement = screen.getByText(childChild.title);
        expect(titleElement).toBeInTheDocument();
        testChild(titleElement, childChild);
      }
    }
  }
  for (let child of children) {
    const titleElement = screen.getAllByText(title);
    expect(titleElement).toBeInTheDocument();
    testChild(titleElement, child);
  }
});
