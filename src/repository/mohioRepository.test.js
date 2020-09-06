import * as repository from './mohioRepository';
import { Given, When, Then } from './mohioRepository.bdd';

beforeEach(async () => {
  await Given.RepositoryIsEmpty();
});

test('given repository is empty when reading mohios then mohios is empty', async () => {
  const mohios = await When.ReadingMohios();
  Then.MohiosIsEmpty(mohios);
});


test('given repository is empty when creating new mohio in repository then generated id is returned', async () => {
  const id = await When.CreatingNewMohioInRepository()
  Then.GeneratedIdIsReturned(id);
});

test('given mohio is created in repository when reading mohios then mohios contains mohio', async () => {
  const id = await Given.MohioIsCreatedInRepository();
  const mohios = await When.ReadingMohios();
  Then.MohiosContainsMohio(mohios, id);
});