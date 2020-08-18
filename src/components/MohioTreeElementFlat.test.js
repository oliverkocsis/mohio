import React from 'react';
import { render, screen } from '@testing-library/react';
import MohioTreeElementFlat from './MohioTreeElementFlat';

describe('A Mohio Tree Element Flat shall', () => {

  const name = 'Tree Element';

  beforeEach(() => {
    render(<MohioTreeElementFlat name={name} />);
  });

  test('display the title', () => {
    const element = screen.getByText(name, { exact: false });
    expect(element).toBeInTheDocument();
  });

});
