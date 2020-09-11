import * as repository from '../repository/mohioRepository';
import * as actionTypes from './actionTypes';

export function initializeApp() {
  return async function (dispatch) {
    const list = await repository.readMohios();
    dispatch(loadMohioList(list));
    const roots = await repository.readRoots();
    const tree = buildTree(roots, list);
    dispatch(loadMohioTree(tree));
    dispatch(selectMohio(roots[0]));
  }
}

export function clearStore() {
  return {
    type: actionTypes.CLEAR_STORE,
  }
}

export function loadMohioList(mohios) {
  return {
    type: actionTypes.SET_MOHIO_LIST,
    mohios,
  }
}

export function loadMohioTree(tree) {
  return {
    type: actionTypes.SET_MOHIO_TREE,
    tree,
  }
}

export function selectMohio(id) {
  return {
    type: actionTypes.SET_MOHIO_VIEW,
    id,
  }
}

function buildTree(ids, list) {
  const tree = [];
  for (let id of ids) {
    const found = list.find((mohio) => id === mohio.id);
    if (found.children) {
      found.children = buildTree(found.children, list);
    }
    tree.push(found);
  }
  return tree;
}