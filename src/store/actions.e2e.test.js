import { Given as GivenClass } from '../repository/mohioRepository.bdd';
import { When as WhenClass, Then as ThenClass } from './actions.bdd';

const Given = new GivenClass();
const When = new WhenClass();
const Then = new ThenClass();

describe('given mohios created in repository when dispatching initialize app', () => {

  let rootMohioId;
  let childMohioId;
  let childOfChildMohioId;

  beforeAll(async () => {
    await Given.RepositoryIsEmpty();
    rootMohioId = await Given.RootMohioIsCreated();
    childMohioId = await Given.ChildMohioIsCreated();
    childOfChildMohioId = await Given.ChildOfChildMohioIsCreated();
    await When.DispatchingInitializeApp();
  });

  test('then load mohio list dispatched', () => {
    Then.LoadMohioListDispatched(rootMohioId, childMohioId, childOfChildMohioId);
  });

  test('then load mohio tree dispatched', () => {
    Then.LoadMohioTreeDispatched(rootMohioId, childMohioId, childOfChildMohioId);
  });

  test('then load mohio view dispatched', () => {
    Then.LoadMohioViewDispatched(rootMohioId);
  });

});
