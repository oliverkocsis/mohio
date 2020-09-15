import { Given as GivenClass, When as WhenClass, Then as ThenClass } from './App.bdd'

const Given = new GivenClass();
const When = new WhenClass();
const Then = new ThenClass();

describe('Given the store is empty when component is rendered', () => {

  let store;
  let component;

  beforeEach(() => {
    store = Given.MockStoreIsEmpty();
    component = When.AppIsRenderedWithStore(store);
  });

  test.skip('then initialize action is dispatched', () => {
    Then.InitializeAppActionIsDispatched(store);
  })

  test('Then app bar is rendered', () => {
    Then.AppBarIsRendered(component);
  });

  test('Then mohio tree is rendered', () => {
    Then.MohioTreeIsRendered(component);
  });

  test('Then mohio view is rendered', () => {
    Then.MohioViewIsRendered(component);
  });


});
