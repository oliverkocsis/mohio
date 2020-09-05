import db from './firebase/firestore';

const collectionName = 'mohios'

export function read() {
  return getFromCollection().then((querySnapshot) => {
    return querySnapshot.docs.map((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
      }
    });
  });
}

export function create(data) {
  return addToCollection(data).then((docRef) => docRef.id);
}

function collection() {
  return db.collection(collectionName);
}

function getFromCollection() {
  return collection().get();
}

function addToCollection(data) {
  return collection().add(data);
}