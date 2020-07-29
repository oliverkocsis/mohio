import React from 'react';
import { render, screen } from '@testing-library/react';
import TreeElement from './TreeElement';

describe('Tree Element', () => {

  const title = 'The Raven';
  const children = ['Once upon a midnight dreary', 'while I pondered', 'weak and weary', 'Over many a quaint and curious volume of forgotten lore'];

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
