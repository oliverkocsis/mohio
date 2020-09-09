import * as repository from '../repository/mohioRepository';
import * as actionTypes from './actionTypes';

export function initializeApp() {
  return function (dispatch) {
    return repository.read().then((mohios) => dispatch(loadMohioList(mohios)));
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
    mohios
  }
}

export function loadMohioTree(mohios) {
  return {
    type: actionTypes.SET_MOHIO_TREE,
    mohios
  }
}

export function selectMohio(id) {
  return {
    type: actionTypes.SET_MOHIO_VIEW,
    id
  }
}