import store from "./store";
import * as actions from './actions';
import { Given } from './store.testutil';
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