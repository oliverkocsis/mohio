import { firestore, initializeTestApp, deleteApp } from '../database/firebase';
import * as axios from 'axios';
import store from './store';
import { getMohios } from './actons';

let db;

beforeAll(() => {
  initializeTestApp();
  db = firestore();
  return axios.delete('http://localhost:8080/emulator/v1/projects/mohio-app/databases/(default)/documents');
});

afterAll(() => {
  return deleteApp();
});

test('Action loads mohios from store', () => {
  const data = {
    name: "Lorem ipsum",
    definition: "Lorem ipsum dolor sit amet",
  };
  return db.collection("mohios").add(data)
    .then((docRef) => {
      store.dispatch(getMohios());
      const state = store.getState()
      expect(state.mohios.length).toBe(1);
    })
});