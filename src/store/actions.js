import * as repository from '../repository/mohioRepository';
import * as actionTypes from './actionTypes';
import { getView } from './state';

async function initializeAppDispatcher(dispatch, getState) {
  const list = await repository.readMohios();
  dispatch(setMohioList(list));
  const roots = await repository.readRoots();
  const tree = buildTree(roots, list);
  dispatch(setMohioTree(tree));
  const state = getState();
  const id = defaultId(state, roots);
  dispatch(setMohioView(id));
}

export function initializeApp() {
  return initializeAppDispatcher;
}

export function clearStore() {
  return {
    type: actionTypes.CLEAR_STORE,
  }
}

export function setMohioList(mohios) {
  return {
    type: actionTypes.SET_MOHIO_LIST,
    mohios,
  }
}

export function setMohioTree(tree) {
  return {
    type: actionTypes.SET_MOHIO_TREE,
    tree,
  }
}

export function setMohioView(id) {
  return {
    type: actionTypes.SET_MOHIO_VIEW,
    id,
  }
}

function buildTree(ids, list) {
  const tree = [];
  for (let id of ids) {
    const found = list.find((mohio) => id === mohio.id);
    const mohio = { id: found.id, name: found.name };
    if (found.children) {
      mohio.children = buildTree(found.children, list);
    }
    tree.push(mohio);
  }
  return tree;
}

function defaultId(state, roots) {
  const view = getView(state);
  if (view && view.id) {
    return view.id;
  } else {
    return roots[0];
  }
}