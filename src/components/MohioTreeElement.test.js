import React from 'react';
import { screen, } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderComponentWithStore } from './ComponentTestUtils';

import MohioTreeElement from './MohioTreeElement';

test('when mohio does not have children then MohioTreeElementFlat is rendered', () => {
  const mohio = {
    id: 'c79d0a13-91eb-4f30-bbf3-dad8dc228303',
    name: 'MohioTreeElementFlat',
  };
  renderComponentWithStore(<MohioTreeElement mohio={mohio} />);
  const element = screen.getByText(mohio.name);
  expect(element).toBeInTheDocument();
});

test('when mohio has children then MohioTreeElementMultiLevel is rendered', async () => {
  const mohio = {
    id: 'a012e594-46b0-44ba-a4eb-76b6a0fd8680',
    name: 'MohioTreeElementMultiLevel',
    children: [
      {
        id: 'ab96e45b-aff4-4799-9d44-5ec3dd9bda2a',
        name: 'Child One',
      }
    ]
  };
  renderComponentWithStore(<MohioTreeElement mohio={mohio} />);
  const element = screen.getByText(mohio.name);
  expect(element).toBeInTheDocument();
  userEvent.click(element);
  const child = await screen.findByText(mohio.children[0].name);
  expect(child).toBeInTheDocument();
});
