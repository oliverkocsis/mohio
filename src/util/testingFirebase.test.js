import { firestore } from '../firebase';

let db;

beforeEach(() => {
  db = firestore();
  db.settings({
    host: "localhost:8080",
    ssl: false
  });
});

test('Emulator firestore is empty by default', () => {
  return getCollection().then((querySnapshot) => {
    expect(querySnapshot.empty).toBeTruthy();
  });
});

test('Add data', () => {
  const data = {
    first: "Ada",
    last: "Lovelace",
    born: 1815
  };
  return addToCollection(data).then(function (docRef) {
    expect(docRef.id).toBeDefined();
  });
});

test('Read data', () => {
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