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
  return addToCollection({
    first: "Ada",
    last: "Lovelace",
    born: 1815
  }).then(function (docRef) {
    console.log("Document written with ID: ", docRef.id);
  }).catch(function (error) {
    console.error("Error adding document: ", error);
  });
});

test('Read data', () => {
  return getCollection().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
    });
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