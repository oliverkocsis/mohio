
import { Given as GivenClass, When as WhenClass, Then as ThenClass } from './store.bdd';

const Given = new GivenClass();
const When = new WhenClass();
const Then = new ThenClass();

describe('repository is empty and store is created', () => {

  beforeAll(async () => {
    await Given.RepositoryIsEmpty();
    Given.StoreIsCreated();
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

    let rootMohioId;
    let childMohioId;
    let childOfChildMohioId;

    beforeAll(async () => {
      rootMohioId = await Given.RootMohioIsCreated();
      childMohioId = await Given.ChildMohioIsCreated();
      childOfChildMohioId = await Given.ChildOfChildMohioIsCreated();
      await When.DispatchingInitializeAppAction();
    });

    test('then state contains mohios list', () => {
      Then.StateContainsMohioList(rootMohioId, childMohioId, childOfChildMohioId);
    });

    test('then state contains mohios tree', () => {
      Then.StateContainsMohioTree(rootMohioId, childMohioId, childOfChildMohioId);
    });

    test('then state contains mohios view', () => {
      Then.StateContainsRootMohioView(rootMohioId, childMohioId);
    });

    describe('when dispatching select mohio', () => {
      beforeAll(async () => {
        await When.DispatchingSelectMohio(childMohioId);
      });

      test('then state contains child mohio view', () => {
        Then.StateContainsChildMohioView(childMohioId, childOfChildMohioId)
      });
    });

  });

});

