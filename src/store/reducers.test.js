import { Given, When, Then } from './reducers.bdd';

test('given state is undefined and no action defined when executing reducer then state conatins empty mohios and state contains no selected mohio (initial state shall be empty)', () => {
  Given.StateIsUndefined();
  Given.ActionIsUndefined();
  When.ExecutingReducer();
  Then.StateContainsEmptyMohios();
  Then.StateContainsNoSelectedMohio();
});

test('given state is empty and action is set mohios when executing reducer then state contains mohios and states contains default selected mohio', () => {
  Given.StateIsEmpty();
  Given.ActionIsSetMohios();
  When.ExecutingReducer();
  Then.StateContainsMohios();
  Then.StateContainsDefaultSelectedMohio();
});

test('given state is empty and action is clear store when executing reducer then state conatins empty mohios and state contains no selected mohio', () => {
  Given.StateContainsMohios();
  Given.ActionIsClearStore();
  When.ExecutingReducer();
  Then.StateContainsEmptyMohios();
  Then.StateContainsNoSelectedMohio();
});

test('given state contains mohios and action is select mohio when executing reducer then state contains mohios and states contains selected selected mohio', () => {
  Given.StateContainsMohios();
  Given.ActionIsSelectMohio();
  When.ExecutingReducer();
  Then.StateContainsMohios();
  Then.StateContainsSelectedSelectedMohio();
});
