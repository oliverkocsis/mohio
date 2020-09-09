import db from './firestore';
import { clearFirestore } from './firestore.testutil';

describe('given firestore is empty', () => {

  beforeEach(async () => {
    await Given.FirestoreIsEmpty();
  });

  test('when getting collection then collection is empty (firestore is empty by default)', async () => {
    const querySnapshot = await When.GettingCollection();
    Then.CollectionIsEmpty(querySnapshot);
  });

  test('when adding new data to collection then generated id is returned', async () => {
    const docRef = await When.AddingNewDataToCollection();
    Then.GeneratedIdIsReturned(docRef);
  });

  test('given data is added to Firestore when getting collection then collection contains data', async () => {
    await Given.DataIsAddedToCollection()
    const querySnapshot = await When.GettingCollection();
    Then.CollectionContainsData(querySnapshot);
  });
});

const data = {
  first: "Ada",
  last: "Lovelace",
  born: 1815
};

const Given = {
  FirestoreIsEmpty: async () => {
    return clearFirestore();
  },

  DataIsAddedToCollection: async () => {
    return addToCollection(data);
  },
}

const When = {
  GettingCollection: async () => {
    return getCollection();
  },

  AddingNewDataToCollection: async () => {
    return addToCollection(data);
  },
}

const Then = {
  CollectionIsEmpty: (querySnapshot) => {
    expect(querySnapshot.empty).toBeTruthy();
  },

  CollectionContainsData: (querySnapshot) => {
    expect(querySnapshot.size).toBe(1);
    const actual = querySnapshot.docs[0].data();
    expect(actual.first).toBe(data.first);
    expect(actual.last).toBe(data.last);
    expect(actual.born).toBe(data.born);
  },

  GeneratedIdIsReturned: (docRef) => {
    expect(docRef.id).toBeDefined();
  }
}


const collection = () => {
  const collection = 'users';
  return db.collection(collection);
}

const getCollection = () => {
  return collection().get();
}

const addToCollection = (data) => {
  return collection().add(data);
}