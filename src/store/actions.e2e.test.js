import { Given as GivenClass, When as WhenClass, Then as ThenClass } from './actions.bdd';

const Given = new GivenClass();
const When = new WhenClass();
const Then = new ThenClass();

describe('given mohios created in repository ', () => {

  let store;
  let rootMohioId;
  let childMohioId;
  let childOfChildMohioId;

  beforeAll(async () => {
    await Given.RepositoryIsEmpty();
    rootMohioId = await Given.RootMohioIsCreated();
    childMohioId = await Given.ChildMohioIsCreated();
    childOfChildMohioId = await Given.ChildOfChildMohioIsCreated();
  });

  describe('and state does not contain mohio view id when dispatching initialize app', () => {
    beforeAll(async () => {
      store = Given.StateDoesNotContainMohioViewId();
      await When.DispatchingInitializeApp(store);
    });

    test('then load mohio list dispatched', () => {
      Then.LoadMohioListDispatched(store, rootMohioId, childMohioId, childOfChildMohioId);
    });

    test('then load mohio tree dispatched', () => {
      Then.LoadMohioTreeDispatched(store, rootMohioId, childMohioId, childOfChildMohioId);
    });

    test('then load default mohio view dispatched', () => {
      Then.LoadMohioViewDispatched(store, rootMohioId);
    });
  });


  describe('and state contains mohio view id when dispatching initialize app', () => {
    beforeAll(async () => {
      store = Given.StateContainsMohioViewId(childMohioId);
      await When.DispatchingInitializeApp(store);
    });

    test('then load mohio list dispatched', () => {
      Then.LoadMohioListDispatched(store, rootMohioId, childMohioId, childOfChildMohioId);
    });

    test('then load mohio tree dispatched', () => {
      Then.LoadMohioTreeDispatched(store, rootMohioId, childMohioId, childOfChildMohioId);
    });

    test('then load child mohio view dispatched', () => {
      Then.LoadMohioViewDispatched(store, childMohioId);
    });
  });
});
