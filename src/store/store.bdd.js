import store from "./store";
import * as actions from './actions';
import { wait } from "@testing-library/dom";

import { Given as GivenMohioRepository } from '../repository/mohioRepository.bdd';
import { rootMohio, childMohio, childOfChildMohio } from '../repository/mohioRepository.bdd';

export class Given extends GivenMohioRepository {
  StoreIsCreated() {
    jest.resetModules();
  }
}

export class When {

  async DispatchingInitializeAppAction() {
    store.dispatch(actions.initializeApp());
    return wait(() => {
      const list = getMohioList();
      expect(list.length).toBeGreaterThan(0);
      const tree = getMohioTree();
      expect(tree.length).toBeGreaterThan(0);
    });
  }

  async DispatchingSelectMohio(childMohioId) {
    store.dispatch(actions.setMohioView(childMohioId));
    return wait(() => {
      const view = getMohioView();
      expect(view.id).toBe(childMohioId);
    });
  }


}

export class Then {

  StateContainsEmptyMohioList() {
    const list = getMohioList();
    expect(list.length).toBe(0);
  }

  StateContainsEmptyMohioTree() {
    expect(getMohioTree().length).toBe(0);
  }

  StateContainsEmptyMohioView() {
    expect(getMohioView()).toBeNull();
  }

  StateContainsMohioList(rootMohioId, childMohioId, childOfChildMohioId) {
    const actualList = getMohioList();
    const expectedList = [
      { id: childOfChildMohioId, ...childOfChildMohio },
      { id: childMohioId, ...childMohio, children: [childOfChildMohioId] },
      { id: rootMohioId, ...rootMohio, children: [childMohioId] },
    ];
    expect(sortMohioList(actualList)).toStrictEqual(sortMohioList(expectedList));
  }

  StateContainsMohioTree(rootMohioId, childMohioId, childOfChildMohioId) {
    const actualTree = getMohioTree();
    const expectedTree = [
      {
        id: rootMohioId,
        name: rootMohio.name,
        children: [
          {
            id: childMohioId,
            name: childMohio.name,
            children: [
              {
                id: childOfChildMohioId,
                name: childOfChildMohio.name,
              }
            ],
          }
        ],
      }
    ]
    expect(actualTree).toStrictEqual(expectedTree);
  }

  StateContainsRootMohioView(rootMohioId, childMohioId) {
    const view = getMohioView();
    const expected = {
      id: rootMohioId,
      ...rootMohio,
      children: [childMohioId],
    };
    expect(view).toStrictEqual(expected);
  }

  StateContainsChildMohioView(childMohioId, childOfChildMohioId) {
    const view = getMohioView();
    const expected = {
      id: childMohioId,
      ...childMohio,
      children: [childOfChildMohioId],
    };
    expect(view).toStrictEqual(expected);
  }

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

function sortMohioList(list) {
  return list.sort((a, b) => a.id.localeCompare(b.id));
}