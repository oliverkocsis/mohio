import React from 'react';
import { renderWithStore } from '../util/reduxUtil';
import { screen } from '@testing-library/react';
import MohioTreeElementFlat from './MohioTreeElementFlat';

describe('A Mohio Tree Element Flat shall', () => {

  const name = 'Tree Element';

  beforeEach(() => {
    renderWithStore(<MohioTreeElementFlat name={name} />);
  });

  test('display the title', () => {
    const element = screen.getByText(name);
    expect(element).toBeInTheDocument();
  });

});
