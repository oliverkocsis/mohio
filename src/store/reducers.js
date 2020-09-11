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
  return initialState;
}

function reduceSetMohioList(state, action) {
  const mohios = state.mohios;
  const list = action.mohios;
  const view = list.length > 0 ? list[0] : null;
  return {
    ...state,
    mohios: {
      ...mohios,
      list: list,
      view: view,
    }
  }
}

function reduceSetMohioTree(state, action) {
  const mohios = state.mohios;
  const list = mohios.list;
  const tree = action.tree;
  return {
    ...state,
    mohios: {
      ...mohios,
      tree: mapIdsToMohios(tree, list),
    }
  }
}

function reduceSetMohioView(state, action) {
  const mohios = state.mohios;
  const list = mohios.list;
  const find = action.id;
  return {
    ...state,
    mohios: {
      ...mohios,
      view: findMohioById(find, list),
    }
  }
}

function mapIdsToMohios(ids, list) {
  const tree = [];
  for (const id of ids) {
    const mohio = findMohioById(id.id, list);
    if (id.children) {
      mohio.children = mapIdsToMohios(id.children, list);
    }
    tree.push(mohio);
  }
  return tree;
}

function findMohioById(id, list) {
  return list.find((mohio) => mohio.id === id);
}