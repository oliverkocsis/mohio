import * as actionTypes from './actionTypes';

export const initialState = {
  mohios: [],
  mohioSelected: null,
}

function reducers(state = initialState, action) {
  switch (action.type) {
    case actionTypes.CLEAR_STORE:
      return reduceClearStore();
    case actionTypes.SET_MOHIOS:
      return reduceSetMohios(state, action);
    case actionTypes.SELECT_MOHIO:
      return reduceSelectMohio(state, action);
    default:
      return state
  }
}

export default reducers;

function reduceClearStore() {
  return initialState;
}

function reduceSetMohios(state, action) {
  const mohios = action.mohios;
  return {
    ...state,
    mohios: mohios,
    mohioSelected: mohios[0]
  }
}

function reduceSelectMohio(state, action) {
  return {
    ...state,
    mohioSelected: select(state.mohios, action.id)
  }
}

function findMohio(mohio, id) {
  if (mohio.id === id) {
    return mohio;
  } else {
    if (mohio.children) {
      for (let child of mohio.children) {
        const found = findMohio(child, id);
        if (found) {
          return found;
        }
      }
    }
  }
}

function select(mohios, id) {
  for (let mohio of mohios) {
    const found = findMohio(mohio, id);
    if (found) {
      return found;
    }
  }
}