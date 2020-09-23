import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderComponentWithStore, createMockStoreWithState } from './ComponentTestUtils';

import MohioTreeElementFlat from './MohioTreeElementFlat';
import { setMohioView } from '../store/actions'

let mohio;
let store;

beforeEach(() => {
  mohio = {
    id: 'c79d0a13-91eb-4f30-bbf3-dad8dc228303',
    name: 'MohioTreeElementFlat',
  };
  store = createMockStoreWithState();
  renderComponentWithStore(<MohioTreeElementFlat mohio={mohio} />, store);
});

test('when component is rendered then name is displayed', () => {
  const element = screen.getByText(mohio.name);
  expect(element).toBeInTheDocument();
});

test('when clicking on component then select mohio action is dispatched', () => {
  const element = screen.getByText(mohio.name);
  userEvent.click(element);
  const dispatched = store.dispatch.mock.calls[0];
  expect(dispatched[0]).toStrictEqual(setMohioView(mohio.id));
});