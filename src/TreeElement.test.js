import React from 'react';
import { render, screen } from '@testing-library/react';
import TreeElement from './TreeElement';


describe('A flat Tree Element shall', () => {

  const title = 'Tree Element';

  beforeEach(() => {
    render(<TreeElement title={title} />);
  });

  test('display the title', () => {
    const titleElement = screen.getByText(title, { exact: false });
    expect(titleElement).toBeInTheDocument();
  });

});

describe('A two level Tree Element shall', () => {

  const title = 'Tree Element';
  const children = ['Title', 'Children'];

  beforeEach(() => {
    render(<TreeElement title={title} children={children} />);
  });

  test('display the title', () => {
    const titleElement = screen.getByText(title, { exact: false });
    expect(titleElement).toBeInTheDocument();
  });

  test('display the children', () => {
    for (let child of children) {
      const childElement = screen.getByText(child, { exact: false });
      expect(childElement).toBeInTheDocument();
    }
  });
});

describe('A multi level Tree Element shall', () => {

  const title = 'Tree Element';
  const children = [
    'About',
    { title: 'Components', children: ['Title', 'Children'] },
    {
      title: 'Behavior', children: [
        { title: 'Flat', children: ['display the title'] },
        { title: 'Multi Level', children: ['display the title', 'display the children', 'display the children of children'] }]
    }];

  beforeEach(() => {
    render(<TreeElement title={title} children={children} />);
  });

  test('display the title', () => {
    const titleElement = screen.getByText(title, { exact: false });
    expect(titleElement).toBeInTheDocument();
  });

  test('display the children and the children of children', () => {
    const testChild = (parent, child) => {
      if (typeof child === 'string') {
        const childElement = screen.getByText(child, { exact: false });
        expect(childElement).toBeInTheDocument();
        expect(parent).toContainElement(childElement);
      } else {
        for (let childChild of child.children) {
          const titleElement = screen.getByText(childChild.title, { exact: false });
          expect(titleElement).toBeInTheDocument();
          testChild(titleElement, childChild);
        }
      }
    }
    for (let child of children) {
      const titleElement = screen.getByText(title, { exact: false });
      expect(titleElement).toBeInTheDocument();
      testChild(titleElement, child);
    }
  });

});
