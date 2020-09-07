
import store from "./store";
import { Given, When, Then } from './store.bdd';

beforeEach(async () => {
  return Given.StoryIsEmpty();
});

test('given store is empty when getting state then state contains empty mohios and state contains no mohio selected', () => {

  const state = When.GettingState();
  Then.StateContainsEmptyMohios(state);
  Then.StateContainsNoSelectedMohio(state);
});

test('given store is empty and two mohios are created in repository when dispatching "read mohios from repository" action then mohios are loaded into the store', async (done) => {
  await Given.MohiosAreCreatedInRepository();
  store.subscribe(() => {
    Then.StateContainsMohios();
    Then.StateContainsSelectedMohio();
    done();
  });
  When.DispatchingReadMohiosFromRepositoryAction();
});