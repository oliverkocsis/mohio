import React from 'react';
import { Provider } from 'react-redux';
import { render as testingLibraryRender } from '@testing-library/react';
import store from "./store";
import * as actions from './actions';
import { Given as GivenMohioRepository } from "../repository/mohioRepository.bdd";

export function renderWithStore(ui) {
  return testingLibraryRender(<Provider store={store}>{ui}</Provider>);
}

export class Given {
  static async StoryIsEmpty() {
    return GivenMohioRepository.RepositoryIsEmpty();
  }

  static async MohiosAreCreatedInRepository() {
    return GivenMohioRepository.MohiosAreCreatedInRepository
  }
}

export class When {
  static GettingState() {
    return store.getState();
  }

  static DispatchingReadMohiosFromRepositoryAction() {
    store.dispatch(actions.readMohiosFromRepository());
  }
}

export class Then {
  static StateContainsEmptyMohios() {
    expect(Then.getMohios().length).toBe(0);
  }

  static StateContainsNoSelectedMohio() {
    expect(Then.getMohioSelected()).toBeNull();
  }

  static StateContainsMohios() {
    expect(Then.getMohios().length).toBe(2);
  }

  static StateContainsSelectedMohio() {
    expect(Then.getMohioSelected()).not.toBeNull();
  }

  static getMohios() {
    return store.getState().mohios;
  }

  static getMohioSelected() {
    return store.getState().mohioSelected;
  }
}