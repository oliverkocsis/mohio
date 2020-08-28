import { firestore } from '../firebase';

let db;

beforeEach(() => {
  db = firestore();
});


test('Add data', () => {
  return db.collection("users").add({
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
  return db.collection("users").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
    });
  });
});