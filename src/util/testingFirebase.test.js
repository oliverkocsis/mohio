import { firestore } from '../firebase';
import * as axios from 'axios';

let db;

beforeAll(() => {
  db = firestore();
  db.settings({
    host: "localhost:8080",
    ssl: false
  });
  return axios.delete('http://localhost:8080/emulator/v1/projects/mohio-app/databases/(default)/documents');
});

test('Emulator firestore is empty by default', (done) => {
  getCollection().then((querySnapshot) => {
    expect(querySnapshot.empty).toBeTruthy();
    done();
  });
});

test.skip('Add data', () => {
  const data = {
    first: "Ada",
    last: "Lovelace",
    born: 1815
  };
  return addToCollection(data).then(function (docRef) {
    expect(docRef.id).toBeDefined();
  });
});

test.skip('Read data', () => {
  return getCollection().then((querySnapshot) => {
    expect(querySnapshot.size).toBe(1);
  });
});

function collection() {
  const collection = 'users';
  return db.collection(collection);
}

function getCollection() {
  return collection().get();
}

function addToCollection(data) {
  return collection().add(data);
}