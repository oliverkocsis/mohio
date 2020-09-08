import reducers from './reducers';
import * as actionTypes from './actionTypes';
import { mohioLoremIpsum, mohioConsecteturAdipiscingElit } from '../repository/mohioRepository.bdd'

let state;
let action;

const mohioLoremIpsumWithId = {
  ...mohioLoremIpsum,
  id: '65bbc8ed6266',
}

const mohioConsecteturAdipiscingElitWithId = {
  ...mohioConsecteturAdipiscingElit,
  id: '8d1079fc851e',
}

const mohiosLoremIpsumWithId = [
  mohioLoremIpsumWithId,
  mohioConsecteturAdipiscingElitWithId,
];

export class Given {
  static StateIsUndefined() {
    state = undefined;
  }

  static StateIsEmpty() {
    const emptyState = {
      mohios: [],
      mohioSelected: null,
    };
    state = emptyState;
  }

  static StateContainsMohios() {
    const notEmptyState = {
      mohios: mohiosLoremIpsumWithId,
      mohioSelected: mohioLoremIpsumWithId,
    };
    state = notEmptyState;
  }

  static ActionIsUndefined() {
    action = { type: '' };
  }


  static ActionIsClearStore() {
    action = { type: actionTypes.CLEAR_STORE };
  }

  static ActionIsSetMohios() {
    action = {
      type: actionTypes.SET_MOHIOS,
      mohios: mohiosLoremIpsumWithId,
    };
  }

  static ActionIsSelectMohio() {
    action = {
      type: actionTypes.SELECT_MOHIO,
      id: mohioConsecteturAdipiscingElitWithId.id,
    };
  }
}

export class When {
  static ExecutingReducer() {
    state = reducers(state, action);
  }
}

export class Then {
  static StateContainsEmptyMohios() {
    expect(state.mohios.length).toBe(0);
  }

  static StateContainsNoSelectedMohio() {
    expect(state.mohioSelected).toBeNull();
  }

  static StateContainsMohios() {
    expect(state.mohios).toStrictEqual(mohiosLoremIpsumWithId);
  }

  static StateContainsDefaultSelectedMohio() {
    expect(state.mohioSelected).toStrictEqual(mohioLoremIpsumWithId);
  }

  static StateContainsSelectedSelectedMohio() {
    expect(state.mohioSelected).toStrictEqual(mohioConsecteturAdipiscingElitWithId);
  }
}