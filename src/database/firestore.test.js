import db from './firestore';
import axios from 'axios';

beforeAll(() => {
  return axios.delete('http://localhost:8080/emulator/v1/projects/mohio-app/databases/(default)/documents');
});

test('npm test script initializes firestore using an amulator at localhost which is empty by default', () => {
  return getCollection().then((querySnapshot) => {
    expect(querySnapshot.empty).toBeTruthy();
  });
});

test('can add data', () => {
  const data = {
    first: "Ada",
    last: "Lovelace",
    born: 1815
  };
  return addToCollection(data).then(function (docRef) {
    expect(docRef.id).toBeDefined();
  });
});

test('can read data which has been created', () => {
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