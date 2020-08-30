import db from './firebase/firestore';

const collectionName = 'mohios'

export function read() {
  return getFromCollection().then((querySnapshot) => {
    return querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data()
      }
    });
  });
}

export function create(data) {
  return addToCollection(data);
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