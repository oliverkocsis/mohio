import React from 'react';
import { screen, } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderComponentWithStore, createMockStoreWithState } from './components/ComponentTestUtils';

import App from './App';
import { initializeApp } from './store/actions';
import { initialState } from './store/reducers';


test.only('when component is rendered then initialize app action is dispatched', () => {
  When.ComponentIsRendered();
  Then.InitializeAppActionIsDispatched();
});

test('given mohio tree in store when component is rendered then tree is displayed', () => {
  fail();
});

test('given mohio selected in store when component is rendered then view is displayed', () => {
  fail();
});

const Data = {
  store: undefined,
}

const When = {
  ComponentIsRendered: () => {
    Data.store = createMockStoreWithState(initialState);
    renderComponentWithStore(<App />, Data.store);
  },
}

const Then = {
  InitializeAppActionIsDispatched: () => {
    const dispatched = Data.store.dispatch.mock.calls[0];
    expect(dispatched[0]).toStrictEqual(initializeApp());
  },
}