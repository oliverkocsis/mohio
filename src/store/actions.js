import * as repository from '../repository/mohioRepository';
import * as actionTypes from './actionTypes';

export function readMohiosFromRepository() {
  return function (dispatch) {
    return repository.read().then((mohios) => dispatch(setMohios(mohios)));
  }
}

export function clearStore() {
  return {
    type: actionTypes.CLEAR_STORE,
  }
}

export function setMohios(mohios) {
  return {
    type: actionTypes.SET_MOHIOS,
    mohios
  }
}

export function selectMohio(name) {
  return {
    type: actionTypes.SELECT_MOHIO,
    name
  }
}