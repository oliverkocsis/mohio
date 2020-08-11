import React from 'react';
import { render, screen } from '@testing-library/react';
import MohioTreeElement from './MohioTreeElement';
import { MohioTreeElementFlatTestId } from './MohioTreeElementFlat';
import { MohioTreeElementMultiLevelTestId } from './MohioTreeElementMultiLevel';

const mohioTreeElementFlat = 'MohioTreeElementFlat';
const mohioTreeElementMultiLevel = 'MohioTreeElementMultiLevel';

const mohios = [
  { name: mohioTreeElementFlat, value: mohioTreeElementFlat },
  {
    name: mohioTreeElementMultiLevel, value: mohioTreeElementMultiLevel, children: [
      { name: 'MohioTreeElementMultiLevel-MohioTreeElementFlat1', value: 'MohioTreeElementMultiLevel-MohioTreeElementFlat1' },
    ]
  },
];

beforeEach(() => {
  render(<MohioTreeElement mohios={mohios} />);
});

test('render MohioTreeElementFlat when no child provided', () => {
  const elements = screen.getAllByTestId(MohioTreeElementFlatTestId);
  expect(elements[0]).toHaveTextContent(mohioTreeElementFlat);
});

test('render MohioTreeElementMultiLevel when no child provided', () => {
  const element = screen.getByTestId(MohioTreeElementMultiLevelTestId);
  expect(element).toHaveTextContent(mohioTreeElementMultiLevel);
});
