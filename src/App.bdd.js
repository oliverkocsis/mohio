import React from 'react';
import { findByText, getByText, fireEvent } from '@testing-library/dom';
import App from './App';
import { Given as GivenStore, When as WhenStore } from './store/store.bdd';
import { Given as GivenMohioRepository, rootMohio, mohioConsecteturAdipiscingElit } from './repository/mohioRepository.bdd';

let app;

export class Given {
  static async MohiosCreatedInRepository() {
    await GivenMohioRepository.RepositoryIsEmpty();
    return GivenMohioRepository.MohiosAreCreatedInRepository();
  }

  static async AppIsRenderedWithStore() {
    const { container } = await GivenStore.ComponentIsRenderedWithStore(<App />);
    app = container;
  }
}

export class When {
  static ClickingOnTreeElement() {
    const mohioTreeElement = getMohioTreeElement();
    const toSelectFirstLevelMohioNavigationElement = getByText(mohioTreeElement, toSelectFirstLevelMohioName);
    fireEvent.click(toSelectFirstLevelMohioNavigationElement);
    const mohioViewElement = getMohioViewElement();
    const nameElement = getByText(mohioViewElement, toSelectFirstLevelMohioName);
    expect(nameElement).toBeInTheDocument();
  }
}

export class Then {
  static async MohiosTreeIsDisplayed() {
    const mohioTreeElement = getMohioTreeElement();
    const mohioLoremIpsumElement = await findByText(mohioTreeElement, rootMohio.name);
    const mohioConsecteturAdipiscingElitElement = await findByText(mohioTreeElement, mohioConsecteturAdipiscingElit.name);
    expect(mohioLoremIpsumElement).toBeInTheDocument();
    expect(mohioConsecteturAdipiscingElitElement).toBeInTheDocument();
  }

  static async SelectedMohioIsDisplayedInView() {

  }
}

const getMohioTreeElement = () => {
  const MohioTreeRootElement = 'nav';
  return app.querySelector(MohioTreeRootElement);
}

const getMohioViewElement = () => {
  const MohioViewRootElement = 'main';
  return app.querySelector(MohioViewRootElement);
}