import * as repository from './mohioRepository';
import { Given, When, Then } from './mohioRepository.bdd';

beforeEach(() => {
  return Given.RepositoryIsEmpty();
});

test('given repository is empty when reading mohios then mohios is empty', () => {
  return When.ReadingMohios()
  .then((mohios) => Then.MohiosIsEmpty(mohios));
});


test('given repository is empty when creating new mohio in repository then generated id is returned', () => {
  return When.CreatingNewMohioInRepository()
    .then((id) => Then.GeneratedIdIsReturned(id));
});

test('given mohio is created in repository when reading mohios then mohios contains mohio', () => {
  let generatedId;
  return Given.MohioIsCreatedInRepository()
    .then((id) => {
      generatedId = id
      return When.ReadingMohios()
    })
    .then((mohios) => Then.MohiosContainsMohio(mohios, generatedId));
});