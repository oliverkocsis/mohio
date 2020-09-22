import configureStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { initializeApp, loadMohioList, loadMohioTree, selectMohio } from './actions';
import { initialState } from './reducers';
import { Given as GivenMohioRepositoryClass } from '../repository/mohioRepository.bdd';
import { rootMohio, childMohio, childOfChildMohio } from '../repository/mohioRepository.bdd';


const middlewares = [thunk];
const mockStore = configureStore(middlewares);

export class Given extends GivenMohioRepositoryClass {
  StateDoesNotContainMohioViewId() {
    const store = mockStore(initialState);
    return store;
  }

  StateContainsMohioViewId(childMohioId) {
    const state = initialState;
    state.mohios.view = { id: childMohioId };
    const store = mockStore(initialState);
    return store;
  }
}

export class When {

  async DispatchingInitializeApp(store) {
    return store.dispatch(initializeApp());
  }

}

export class Then {

  LoadMohioListDispatched(store, rootMohioId, childMohioId, childOfChildMohioId) {
    const actions = store.getActions();
    const action = actions[0];
    const list = [
      { id: childOfChildMohioId, ...childOfChildMohio },
      { id: childMohioId, ...childMohio, children: [childOfChildMohioId] },
      { id: rootMohioId, ...rootMohio, children: [childMohioId] },
    ]
    const expectedAction = loadMohioList(list);
    expect(action.type).toBe(expectedAction.type);
    const actualMohios = expectedAction.mohios;
    expect(actualMohios.sort()).toStrictEqual(list.sort());
  }

  LoadMohioTreeDispatched(store, rootMohioId, childMohioId, childOfChildMohioId) {
    const actions = store.getActions();
    const action = actions[1];
    const tree = [
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
    expect(action).toStrictEqual(loadMohioTree(tree));
  }

  LoadMohioViewDispatched(store, id) {
    const actions = store.getActions();
    const action = actions[2];
    expect(action).toStrictEqual(selectMohio(id));
  }

};