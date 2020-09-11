import store from "./store";
import * as actions from './actions';
import * as mohioRepository from '../repository/mohioRepository';
import { clearFirestore } from '../repository/firebase/firestore.testutil';
import { wait } from "@testing-library/dom";

describe('given firestore is empty and store is created', () => {

  beforeAll(async () => {
    await Given.FirestoreIsEmpty();
    jest.resetModules();
  });

  test('then state conatins empty mohios list', () => {
    Then.StateContainsEmptyMohioList();
  });

  test('then state conatins empty mohios tree', () => {
    Then.StateContainsEmptyMohioTree();
  });

  test('then state conatins empty mohios view', () => {
    Then.StateContainsEmptyMohioView();
  });


  describe('given mohios created in repository when dispatching initialize app action', () => {

    beforeAll(async () => {
      await Given.MohiosCreatedInRepository();
      return When.DispatchingInitializeAppAction();
    });

    test('then state contains mohios list', () => {
      Then.StateContainsMohioList();
    });

    test('then state contains mohios tree', () => {
      Then.StateContainsMohioTree();
    });

    test('then state contains mohios view', () => {
      Then.StateContainsMohioView();
    });
  });

});

const When = {
  async DispatchingInitializeAppAction() {
    store.dispatch(actions.initializeApp());
    return wait(() => {
      const list = getMohioList();
      expect(list).not.toBeEmpty();
      const tree = getMohioTree();
      expect(tree).not.toBeEmpty();
    });
  }
}

const Then = {
  StateContainsEmptyMohioList() {
    const list = getMohioList();
    expect(list.length).toBe(0);
  },
  StateContainsEmptyMohioTree() {
    expect(getMohioTree().length).toBe(0);
  },
  StateContainsEmptyMohioView() {
    expect(getMohioView()).toBeNull();
  },

  StateContainsMohioList() {
    const list = getMohioList();
    expect(list).toStrictEqual([
      mohioConsecteturAdipiscingElitWithId(),
      mohioMohioLoremIpsumWithId(),
    ]);
  },
  StateContainsMohioTree() {
    const tree = getMohioTree();
    expect(tree).toStrictEqual([
      {
        ...mohioMohioLoremIpsumWithIdWithoutDefinition(),
        children: [
          ...mohioConsecteturAdipiscingElitWithIdWithoutDefinition(),
        ]
      }
    ]);
  },
  StateContainsMohioView() {
    const view = getMohioView();
    const expected = mohioMohioLoremIpsumWithId()
    expect(view).toStrictEqual(expected);
  },
}

function getMohioList() {
  return store.getState().mohios.list;
};
function getMohioTree() {
  return store.getState().mohios.tree;
};
function getMohioView() {
  return store.getState().mohios.view;
};


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