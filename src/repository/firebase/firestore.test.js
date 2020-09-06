import { Given, When, Then } from './firestore.bdd';

beforeEach(async () => {
  await Given.FirestoreIsEmpty();
});

test('given firestore is empty when getting collection then collection is empty (firestore is empty by default)', async () => {
  const querySnapshot = await When.GettingCollection();
  Then.CollectionIsEmpty(querySnapshot);
});

test('given firestore is empty when adding new data to collection then generated id is returned', async () => {
  const docRef = await When.AddingNewDataToCollection();
  Then.GeneratedIdIsReturned(docRef);
});

test('given data is added to Firestore when getting collection then collection contains data', async () => {
  await Given.DataIsAddedToCollection()
  const querySnapshot = await When.GettingCollection();
  Then.CollectionContainsData(querySnapshot);
});

