import React from 'react';
import { render, screen } from '@testing-library/react';
import { getByText } from '@testing-library/dom';

function List(props) {
  return (
    <ul>
      <li>
        Lorem ipsum
        <ul>
          <li>dolor sit</li>
          <li>amet consectetur</li>
        </ul>
      </li>
      <li>
        adipiscing elit
        <ul>
          <li>Morbi ut</li>
          <li>venenatis ligula</li>
        </ul>
      </li>
    </ul>
  );
}

describe('Testing Library', () => {

  beforeEach(() => {
    render(<List />);
  });

  test('queries the first matching node by text', () => {
    const element = screen.getByText('lorem ipsum', { exact: false });
    expect(element).toBeInTheDocument();
  });

  test('queries the first matching node by text of a query result', () => {
    const element = screen.getByText('lorem ipsum', { exact: false });
    const child = getByText(element, 'dolor sit', { exact: false });
    expect(element).toBeInTheDocument();
  });

});