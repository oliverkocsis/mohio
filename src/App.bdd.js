import React from 'react';
import { findByText, getByText, fireEvent, wait } from '@testing-library/dom';
import App from './App';
import store from './store/store';
import * as actions from './store/actions';
import { renderComponentWithStore, createMockStoreWithState } from './components/ComponentTestUtils';
import { Given as GivenMohioRepository } from './repository/mohioRepository.bdd';
import { rootMohio, childMohio, childOfChildMohio } from './repository/mohioRepository.bdd';

export class Given {

  MockStoreIsEmpty() {
    return createMockStoreWithState();
  }

}

export class When {

  AppIsRenderedWithStore(withStore) {
    const { container } = renderComponentWithStore(<App />, withStore);
    return container;
  }


  ClickingOnTreeElement() {
    const mohioTreeElement = getMohioTreeElement();
    const toSelectFirstLevelMohioNavigationElement = getByText(mohioTreeElement, toSelectFirstLevelMohioName);
    fireEvent.click(toSelectFirstLevelMohioNavigationElement);
    const mohioViewElement = getMohioViewElement();
    const nameElement = getByText(mohioViewElement, toSelectFirstLevelMohioName);
    expect(nameElement).toBeInTheDocument();
  }

}

export class Then {

  InitializeAppActionIsDispatched(store) {
    const dispatched = store.dispatch.mock.calls[0];
    expect(dispatched[0]).toStrictEqual(actions.initializeApp());
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

  async MohiosTreeIsDisplayed(component) {
    const mohioTreeElement = getMohioTreeElement(component);
    const mohioLoremIpsumElement = await findByText(mohioTreeElement, rootMohio.name);
    const mohioConsecteturAdipiscingElitElement = await findByText(mohioTreeElement, mohioConsecteturAdipiscingElit.name);
    expect(mohioLoremIpsumElement).toBeInTheDocument();
    expect(mohioConsecteturAdipiscingElitElement).toBeInTheDocument();
  }

  async SelectedMohioIsDisplayedInView() {

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