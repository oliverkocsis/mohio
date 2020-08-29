import { firestore, deleteApp } from '../firebase';
import * as axios from 'axios';
import store from './store';

let db;

beforeAll(() => {
  db = firestore();
  db.settings({
    host: "localhost:8080",
    ssl: false
  });
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