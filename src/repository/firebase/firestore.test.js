import { Given as GivenClass, When as WhenClass, Then as ThenClass } from './firestore.bdd';

const Given = new GivenClass();
const When = new WhenClass(Given);
const Then = new ThenClass(Given, When);

describe('given firestore is empty', () => {

  beforeAll(async () => {
    return Given.FirestoreIsEmpty();
  });

  test('when getting collection then collection is empty', async () => {
    await When.GettingCollection();
    Then.CollectionIsEmpty();
  });

  test('when adding new data to collection then generated id is returned', async () => {
    await When.AddingDataToCollection();
    Then.GeneratedIdIsReturned();
  });

  test('given data is added to Firestore when getting collection then collection contains data', async () => {
    await When.GettingCollection();
    Then.CollectionContainsData();
  });
});