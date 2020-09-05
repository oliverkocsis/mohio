import { Given, When, Then } from './firestore.bdd';

beforeEach(() => {
  return Given.FirestoreIsEmpty();
});

test('given firestore is empty when getting collection then collection is empty (firestore is empty by default)', () => {
  return When.GettingCollection().then((querySnapshot) => Then.CollectionIsEmpty(querySnapshot));
});

test('given firestore is empty when adding new data to collection then generated id is returned', () => {
  return When.AddingNewDataToCollection()
    .then((docRef) => Then.GeneratedIdIsReturned(docRef));
});

test('given data is added to Firestore when getting collection then collection contains data', () => {
  return Given.DataIsAddedToCollection()
    .then(() => When.GettingCollection())
    .then((querySnapshot) => Then.CollectionContainsData(querySnapshot));
});

