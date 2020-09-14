import axios from 'axios';
import db from './firestore';

export const data = {
  first: "Ada",
  last: "Lovelace",
  born: 1815
};

export class Given {
  FirestoreIsEmpty() {
    return axios.delete('http://localhost:8080/emulator/v1/projects/mohio-app/databases/(default)/documents');
  }

  async DataIsAddedToCollection() {
    return addToCollection(data);
  }
}

export class When {

  async GettingCollection() {
    return await getCollection();
  }

  async AddingDataToCollection() {
    return addToCollection(data);
  }
}

export class Then {

  CollectionIsEmpty(querySnapshot) {
    expect(querySnapshot.empty).toBeTruthy();
  }

  CollectionContainsData(querySnapshot) {
    expect(querySnapshot.size).toBe(1);
    const actual = querySnapshot.docs[0].data();
    expect(actual.first).toBe(data.first);
    expect(actual.last).toBe(data.last);
    expect(actual.born).toBe(data.born);
  }

  GeneratedIdIsReturned(docRef) {
    expect(docRef.id).toBeDefined();
  }
}


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