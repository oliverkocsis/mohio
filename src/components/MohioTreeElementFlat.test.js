import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderComponentWithStore, createMockStoreWithState } from './ComponentTestUtils';

import MohioTreeElementFlat from './MohioTreeElementFlat';
import { selectMohio } from '../store/actions'

let mohio;
let store;

beforeEach(() => {
  mohio = {
    id: 'c25fb660',
    name: 'Lorem Ipsum',
  };
  store = createMockStoreWithState();
  renderComponentWithStore(<MohioTreeElementFlat mohio={mohio} />, store);
});

test('given mohio is provided when component is rendered then name is displayed', () => {
  const element = screen.getByText(mohio.name);
  expect(element).toBeInTheDocument();
});

test('given element is rendered when clicking on component then selection mohio action is dispatched', () => {
  const element = screen.getByText(mohio.name);
  userEvent.click(element);
  const dispatched = store.dispatch.mock.calls[0];
  expect(dispatched[1] === selectMohio);
});