import React from 'react';
import { renderWithStore } from '../util/reduxUtil';
import { screen } from '@testing-library/react';
import MohioTreeElement from './MohioTreeElement';
import { testId as MohioTreeElementFlatTestId } from './MohioTreeElementFlat';
import { testId as MohioTreeElementMultiLevelTestId } from './MohioTreeElementMultiLevel';

test('renders MohioTreeElementFlat when no child provided', () => {
  const name = 'MohioTreeElementFlat';
  renderWithStore(<MohioTreeElement name={name} />);
  const element = screen.getByTestId(MohioTreeElementFlatTestId);
  expect(element).toHaveTextContent(name);
});

test('renders MohioTreeElementMultiLevel when children provided', () => {
  const name = 'MohioTreeElementMultiLevel';
  const children = [
    { name: 'Child' },
  ];
  renderWithStore(<MohioTreeElement name={name} children={children} />);
  const element = screen.getByTestId(MohioTreeElementMultiLevelTestId);
  expect(element).toHaveTextContent(name);
});
