import db from './firestore';
import axios from 'axios';

const data = {
  first: "Ada",
  last: "Lovelace",
  born: 1815
};

export class Given {
  static FirestoreIsEmpty() {
    return axios.delete('http://localhost:8080/emulator/v1/projects/mohio-app/databases/(default)/documents');
  }

  static DataIsAddedToCollection() {
    return addToCollection(data);
  }
}

export class When {
  static GettingCollection() {
    return getCollection();
  }

  static AddingNewDataToCollection() {
    return addToCollection(data);
  }
}

export class Then {
  static CollectionIsEmpty(querySnapshot) {
    expect(querySnapshot.empty).toBeTruthy();
  }

  static CollectionContainsData(querySnapshot) {
    expect(querySnapshot.size).toBe(1);
    const actual = querySnapshot.docs[0].data();
    expect(actual.first).toBe(data.first);
    expect(actual.last).toBe(data.last);
    expect(actual.born).toBe(data.born);
  }

  static GeneratedIdIsReturned(docRef) {
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