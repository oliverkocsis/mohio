import { firestore } from '../firebase';

export const GET_MOHIOS = 'GET_MOHIOS';
export const LOAD_MOHIOS = 'LOAD_MOHIOS';
export const SELECT_MOHIO = 'SELECT_MOHIO';

export function getMohios() {
  return function (dispatch) {
    return getMohiosAsync().then((mohios) => dispatch(loadMohios(mohios)));
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

function getMohiosAsync() {
  const db = firestore();
  return db.collection('mohios').get().then((querySnapshot) => querySnapshot.docs.map((doc) => doc.data()));
}