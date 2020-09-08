import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import store from "./store";
import * as actions from './actions';
import { Given as GivenMohioRepository } from "../repository/mohioRepository.bdd";

/**
 * @deprecated use Given.ComponentIsRenderedWithStore(component)
 * @param {*} ui 
 */
export function renderWithStore(ui) {
  return Given.ComponentIsRenderedWithStore(ui);
}

export class Given {
  static StoryIsEmpty() {
    return store.dispatch(actions.clearStore());
  }

  static async RepositoryIsEmpty() {
    return GivenMohioRepository.RepositoryIsEmpty();
  }

  static async MohiosAreCreatedInRepository() {
    return GivenMohioRepository.MohiosAreCreatedInRepository();
  }

  static async ComponentIsRenderedWithStore(component) {
    return render(<Provider store={store}>{component}</Provider>);
  }
}

export class When {
  static DispatchingReadMohiosFromRepositoryAction(then, done) {
    const unsubscribe = store.subscribe(() => {
      if (then) then();
      unsubscribe();
      if (done) done();
    });
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

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent elementum facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in hendrerit gravida rutrum quisque non tellus. Convallis convallis tellus id interdum velit laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus at augue. At augue eget arcu dictum varius duis at consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa sapien faucibus et molestie ac.';

const mohios = [
  { name: 'About', definition: loremIpsum },
  {
    name: 'Domain', definition: loremIpsum, children: [
      { name: 'Bar', definition: loremIpsum },
      { name: 'Tree', definition: loremIpsum },
      {
        name: 'View', definition: loremIpsum, children: [
          { name: 'Name', definition: loremIpsum },
          { name: 'Value', definition: loremIpsum },
        ]
      },
    ]
  },
  {
    name: 'Process', definition: loremIpsum, children: [
      { name: 'Create', definition: loremIpsum },
      { name: 'Edit', definition: loremIpsum },
      { name: 'Delete', definition: loremIpsum },
    ]
  },
];