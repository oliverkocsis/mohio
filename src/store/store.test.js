
import store from "./store";
import { Given, When, Then } from './store.bdd';

beforeEach(async () => {
  Given.StoryIsEmpty();
  return Given.RepositoryIsEmpty();
});

test('given store is empty and repository is empty then state contains empty mohios and state contains no mohio selected', () => {
  Then.StateContainsEmptyMohios();
  Then.StateContainsNoSelectedMohio();
});

test('given store is empty and two mohios are created in repository when dispatching "read mohios from repository" action then mohios are loaded into the store', (done) => {
  Given.MohiosAreCreatedInRepository().then(() => {
    When.DispatchingReadMohiosFromRepositoryAction(() => {
      Then.StateContainsMohios();
      Then.StateContainsSelectedMohio();
    }, done);
  });
});