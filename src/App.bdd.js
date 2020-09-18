import React from 'react';
import { findByText, getByText, fireEvent, wait } from '@testing-library/dom';
import App from './App';
import store from './store/store';
import * as actions from './store/actions';
import { renderComponentWithStore, createMockStoreWithState } from './components/ComponentTestUtils';
import { Given as GivenMohioRepository } from './repository/mohioRepository.bdd';
import { rootMohio, childMohio, childOfChildMohio } from './repository/mohioRepository.bdd';

export class Given {


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

