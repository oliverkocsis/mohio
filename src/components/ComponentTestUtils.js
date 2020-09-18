import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { initialState } from '../store/reducers';


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

export function renderComponentWithRouter(component, initialRouterEntries) {
  return render(<MemoryRouter initialEntries={initialRouterEntries}>{component}</MemoryRouter>)
}

export function renderComonentWithStoreAndRouter(component, store = createMockStoreWithState(), initialRouterEntries) {
  return render(<Provider store={store}><MemoryRouter initialEntries={initialRouterEntries}>{component}</MemoryRouter></Provider>);
}

export const emptyState = initialState;

export const childOfChildMohio = {
  id: 'dabcaa83-c110-45bd-ba37-efe85d86ec23',
  name: "Class Aptent",
  definition: "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
}
export const childMohio = {
  id: '5e787a16-88fa-4a13-be5d-0a35917125ca',
  name: 'Praesent Luctus',
  definition: 'Praesent luctus tortor vel metus tempor, et egestas enim accumsan.',
  children: [childOfChildMohio.id],
}

export const rootMohio = {
  id: '3d624995-ecae-4806-9125-9a8750c1e69a',
  name: 'Lorem Ipsum',
  definition: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  children: [childMohio.id],
}

export const notEmptyState = {
  mohios: {
    list: [rootMohio, childMohio, childOfChildMohio],
    tree: [{ ...rootMohio, children: [{ ...childMohio, children: [{ ...childOfChildMohio }] }] }],
    view: rootMohio,
  },
}