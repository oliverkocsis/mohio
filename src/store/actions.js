import * as repository from '../repository/mohio'

export const LOAD_MOHIOS = 'LOAD_MOHIOS';
export const SELECT_MOHIO = 'SELECT_MOHIO';

export function getMohios() {
  return function (dispatch) {
    return repository.read().then((mohios) => dispatch(loadMohios(mohios)));
  }
}

export function loadMohios(mohios) {
  return {
    type: LOAD_MOHIOS,
    mohios
  }
}

export function selectMohio(name) {
  return {
    type: SELECT_MOHIO,
    name
  }
}