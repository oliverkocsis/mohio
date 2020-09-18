import React from 'react';
import { getByText } from '@testing-library/dom';
import { renderComponentWithStore, createMockStoreWithState } from './ComponentTestUtils';
import MohioLayout from './MohioLayout';
import * as actions from '../store/actions';

describe('Given the store is empty when component is rendered', () => {

  let store;
  let component;

  beforeEach(() => {
    store = Given.MockStoreIsEmpty();
    component = When.AppIsRenderedWithStore(store);
  });

  test('then initialize action is dispatched', () => {
    Then.InitializeAppActionIsDispatched(store);
  })

  test('Then app bar is rendered', () => {
    Then.AppBarIsRendered(component);
  });

  test('Then mohio tree is rendered', () => {
    Then.MohioTreeIsRendered(component);
  });

  test('Then mohio view is rendered', () => {
    Then.MohioViewIsRendered(component);
  });

});

class GivenClass {

  MockStoreIsEmpty() {
    return createMockStoreWithState();
  }

}

class WhenClass {

  AppIsRenderedWithStore(withStore) {
    const { container } = renderComponentWithStore(<MohioLayout />, withStore);
    return container;
  }
}

class ThenClass {
  InitializeAppActionIsDispatched(store) {
    const dispatched = store.dispatch.mock.calls[0];
    expect(dispatched[0]).toBe(actions.initializeApp());
  }

  AppBarIsRendered(component) {
    const appBarElement = getAppBarElement(component);
    expect(appBarElement).toBeInTheDocument();
    const brand = getByText(appBarElement, 'Mohio');
    expect(brand).toBeInTheDocument();
  }

  MohioTreeIsRendered(component) {
    const mohioTreeElement = getMohioTreeElement(component);
    expect(mohioTreeElement).toBeInTheDocument();
  }

  MohioViewIsRendered(component) {
    const mohioViewElement = getMohioViewElement(component);
    expect(mohioViewElement).toBeInTheDocument();
  }
}

function getAppBarElement(app) {
  const rootElement = 'header';
  return app.querySelector(rootElement);
}

function getMohioTreeElement(app) {
  const rootElement = 'nav';
  return app.querySelector(rootElement);
}

function getMohioViewElement(app) {
  const rootElement = 'main';
  return app.querySelector(rootElement);
}

const Given = new GivenClass();
const When = new WhenClass();
const Then = new ThenClass();