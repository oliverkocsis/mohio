import * as actionTypes from './actionTypes';

export const initialState = {
  mohios: {
    list: [],
    tree: [],
    view: null,
  },
}

function reducers(state = initialState, action) {
  switch (action.type) {
    case actionTypes.CLEAR_STORE:
      return reduceClearStore();
    case actionTypes.SET_MOHIO_LIST:
      return reduceSetMohioList(state, action);
    case actionTypes.SET_MOHIO_TREE:
      return reduceSetMohioTree(state, action);
    case actionTypes.SET_MOHIO_VIEW:
      return reduceSetMohioView(state, action);
    default:
      return state
  }
}

export default reducers;

function reduceClearStore() {
  console.debug('reduceClearStore');
  return initialState;
}

function reduceSetMohioList(state, action) {
  console.debug(action);
  const mohios = state.mohios;
  const list = action.mohios;
  return {
    ...state,
    mohios: {
      ...mohios,
      list,
    }
  }
}

function reduceSetMohioTree(state, action) {
  console.debug(action);
  const mohios = state.mohios;
  const tree = action.tree;
  return {
    ...state,
    mohios: {
      ...mohios,
      tree,
    }
  }
}

function reduceSetMohioView(state, action) {
  console.debug(action);
  const mohios = state.mohios;
  const list = mohios.list;
  const find = action.id;
  if (!list || list.length === 0) {
    return {
      ...state,
      mohios: {
        ...mohios,
        view: {
          id: find,
        },
      }
    }
  } else {
    return {
      ...state,
      mohios: {
        ...mohios,
        view: findMohioById(find, list),
      }
    }
  }
}

function findMohioById(id, list) {
  return list.find((mohio) => mohio.id === id);
}