import React from 'react';
import { getByText } from '@testing-library/dom';
import { renderComonentWithStoreAndRouter, createMockStoreWithState, emptyState, notEmptyState, rootMohio, childMohio } from './ComponentTestUtils';
import MohioLayout from './MohioLayout';
import * as actions from '../store/actions';

describe('Given the store is empty when component is rendered', () => {

  let store;
  let component;

  beforeEach(() => {
    store = Given.MockStoreIsEmpty();
    component = When.MohioLayoutIsRendered(store);
  });

  test('then initialize action is dispatched', () => {
    Then.InitializeAppActionIsDispatched(store);
  })

  test('Then mohio app bar is rendered', () => {
    Then.MohioAppBarIsRendered(component);
  });

  test('Then mohio tree is rendered', () => {
    Then.MohioTreeIsRendered(component);
  });

  test('Then mohio view is rendered', () => {
    Then.MohioViewIsRendered(component);
  });

});

describe('Given the store is not empty when component is rendered', () => {

  let store;
  let component;

  beforeEach(() => {
    store = Given.MockStoreIsNotEmpty();
    component = When.MohioLayoutIsRendered(store);
  });

  test('then initialize action is dispatched', () => {
    Then.InitializeAppActionIsDispatched(store);
  })

  test('Then mohio app bar is rendered', () => {
    Then.MohioAppBarIsRendered(component);
  });

  test('Then root mohio is displayed in tree', () => {
    Then.RootMohioIsDisplayedInTree(component);
  });

  test('Then rott mohio is displayed in view', () => {
    Then.RootMohioIsDisplayedInView(component);
  });

});

describe('Given the store is not empty and a initial router entries provided when component is rendered', () => {

  let store;
  let component;

  beforeEach(() => {
    store = Given.MockStoreIsNotEmpty();
    component = When.MohioLayoutIsRendered(store);
  });

  test('then initialize action is dispatched', () => {
    Then.InitializeAppActionIsDispatched(store);
  })

  test('Then mohio app bar is rendered', () => {
    Then.MohioAppBarIsRendered(component);
  });

  test('Then child mohio is displayed in tree', () => {
    Then.ChildMohioIsDisplayedInTree(component);
  });

  test('Then child mohio is displayed in view', () => {
    Then.ChildMohioIsDisplayedInView(component);
  });

});

class GivenClass {

  MockStoreIsEmpty() {
    return createMockStoreWithState(emptyState);
  }

  MockStoreIsNotEmpty() {
    return createMockStoreWithState(notEmptyState);
  }

  InitialRouterEntriesProvided() {
    return [`/${childMohio.id}`];
  }

}

class WhenClass {
  MohioLayoutIsRendered(withStore, initialRouterEntries) {
    const { container } = renderComonentWithStoreAndRouter(<MohioLayout />, withStore, initialRouterEntries);
    return container;
  }
}

class ThenClass {
  InitializeAppActionIsDispatched(store) {
    const dispatched = store.dispatch.mock.calls[0];
    expect(dispatched[0]).toBe(actions.initializeApp());
  }

  MohioAppBarIsRendered(component) {
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

  RootMohioIsDisplayedInTree(component) {
    const mohioTreeElement = getMohioTreeElement(component);
    const name = getByText(mohioTreeElement, rootMohio.name);
    expect(name).toBeInTheDocument();
  }

  RootMohioIsDisplayedInView(component) {
    const mohioViewElement = getMohioViewElement(component);
    const name = getByText(mohioViewElement, rootMohio.name);
    expect(name).toBeInTheDocument();
    const defintition = getByText(mohioViewElement, rootMohio.definition);
    expect(defintition).toBeInTheDocument();
  }

  ChildMohioIsDisplayedInTree(component) {
    const mohioTreeElement = getMohioTreeElement(component);
    const name = getByText(mohioTreeElement, childMohio.name);
    expect(defintition).toBeInTheDocument();
  }

  ChildMohioIsDisplayedInView(component) {
    const mohioViewElement = getMohioViewElement(component);
    const name = getByText(mohioViewElement, childMohio.name);
    expect(name).toBeInTheDocument();
    const defintition = getByText(mohioViewElement, childMohio.definition);
    expect(defintition).toBeInTheDocument();
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