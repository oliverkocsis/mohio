import db from './firestore';
import axios from 'axios';

export function clearFirestoreEmulator() {
  return axios.delete('http://localhost:8080/emulator/v1/projects/mohio-app/databases/(default)/documents');
}

const data = {
  first: "Ada",
  last: "Lovelace",
  born: 1815
};

beforeEach(() => {
  return clearFirestoreEmulator();
});

test('npm test script initializes firestore using an amulator at localhost which is empty by default', () => {
  return getCollection().then((querySnapshot) => {
    expect(querySnapshot.empty).toBeTruthy();
  });
});

test('can add data', () => {

  return addToCollection(data).then((docRef) => {
    expect(docRef.id).toBeDefined();
  });
});

test('can get data ', () => {
  return addToCollection(data)
    .then((docRef) => {
      return getCollection()
    })
    .then((querySnapshot) => {
      expect(querySnapshot.size).toBe(1);
      const actual = querySnapshot.docs[0].data();
      expect(actual.first).toBe(data.first);
      expect(actual.last).toBe(data.last);
      expect(actual.born).toBe(data.born);
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