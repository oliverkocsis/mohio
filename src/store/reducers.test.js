import { Given, When, Then } from './reducers.bdd';

test('given state is undefined and no action defined when executing reducer then state conatins empty mohios and state contains no selected mohio (initial state shall be empty)', () => {
  Given.StateIsUndefined();
  Given.ActionIsUndefined();
  When.ExecutingReducer();
  Then.StateContainsEmptyMohios();
  Then.StateContainsNoSelectedMohio();
});

test('given state is empty and action is set mohios when executing reducer then state the mohios and shall set the selected item to the first element', () => {
  Given.StateIsEmpty();
  Given.ActionIsSetMohios();
  When.ExecutingReducer();
  Then.StateContainsMohios();
  Then.StateContainsDefaultSelectedMohio();
});

test('select mohio shall find the mohio by id and set as selected', () => {
  Given.StateContainsMohios();
  Given.ActionIsSelectMohio();
  When.ExecutingReducer();
  Then.StateContainsMohios();
  Then.StateContainsSelectedSelectedMohio();
});
