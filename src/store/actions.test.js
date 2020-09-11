import configureStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { initializeApp, loadMohioList, loadMohioTree, selectMohio } from './actions';
import { Given } from './store.testutil';
import { initialState } from './reducers';

describe('given mohios and roots in repository when dispatching initialize app', () => {

  beforeAll(async () => {
    await Given.FirestoreIsEmpty();
    await Given.MohiosCreatedInRepository();
    await When.DispatchingInitializeApp();
  });

  test('then load mohio list dispatched', () => {
    Then.LoadMohioListDispatched();
  });


  test('then load mohio tree dispatched', () => {
    Then.LoadMohioTreeDispatched();
  });


  test('then load mohio view dispatched', () => {
    Then.LoadMohioViewDispatched();
  });

});

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore(initialState);

const When = {
  DispatchingInitializeApp: () => {
    return store.dispatch(initializeApp());
  },
};

const Then = {
  LoadMohioListDispatched() {
    const actions = store.getActions();
    const action = actions[0];
    const mohioConsecteturAdipiscingElit = Given.mohioConsecteturAdipiscingElitWithId();
    const mohioLoremIpsum = Given.mohioMohioLoremIpsumWithId();
    mohioLoremIpsum.children = [mohioConsecteturAdipiscingElit];
    const list = [
      mohioConsecteturAdipiscingElit,
      mohioLoremIpsum,
    ]
    expect(action).toStrictEqual(loadMohioList(list));
  },
  LoadMohioTreeDispatched() {
    const actions = store.getActions();
    const action = actions[1];
    const mohioConsecteturAdipiscingElit = Given.mohioConsecteturAdipiscingElitWithId();
    const mohioLoremIpsum = Given.mohioMohioLoremIpsumWithId();
    mohioLoremIpsum.children = [mohioConsecteturAdipiscingElit];
    const tree = [
      mohioLoremIpsum,
    ]
    expect(action).toStrictEqual(loadMohioTree(tree));
  },
  LoadMohioViewDispatched() {
    const actions = store.getActions();
    const action = actions[2];
    expect(action).toStrictEqual(selectMohio(Given.mohioLoremIpsumId));
  },
};