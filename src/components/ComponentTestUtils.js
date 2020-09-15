import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { initialState } from '../store/reducers'

export function createMockStoreWithState(state = initialState) {
  return {
    getState: jest.fn(() => state),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  }
}

export function renderComponentWithStore(component, store = createMockStoreWithState()) {
  return render(<Provider store={store}>{component}</Provider>);
}