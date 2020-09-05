import * as repository from './mohioRepository';
import { Given as GivenFirestore } from './firebase/firestore.bdd';

const mohioLoremIpsum = {
  name: 'Lorem ipsum',
  definition: 'Lorem ipsum dolor sit amet',
}

const mohioLoremIpsumWithId = {
  id: 'c672c2556bd2',
  ...mohioLoremIpsum,
};

const mohioConsecteturAdipiscingElit = {
  id: '376b7c9da518',
  name: 'Consectetur adipiscing elit',
  definition: 'Vivamus in eleifend tortor',
}

const mohioConsecteturAdipiscingElitWithId = {
  id: '376b7c9da518',
  ...mohioConsecteturAdipiscingElit,
}

const mohiosLoremIpsumWithId = [
  mohioLoremIpsumWithId,
  mohioConsecteturAdipiscingElitWithId
];

export class Given {
  static RepositoryIsEmpty() {
    return GivenFirestore.FirestoreIsEmpty();
  }

  static MohioIsCreatedInRepository() {
    return repository.create(mohioLoremIpsum);
  }
}

export class When {
  static ReadingMohios() {
    return repository.read();
  }

  static CreatingNewMohioInRepository() {
    return repository.create(mohioLoremIpsum);
  }
}

export class Then {
  static MohiosIsEmpty(mohios) {
    expect(mohios.length).toBe(0);
  }

  static MohiosContainsMohio(mohios, id) {
    expect(mohios.length).toBe(1);
    const actual = mohios[0];
    expect(actual.id).toBe(id);
    expect(actual.name).toBe(mohioLoremIpsum.name);
    expect(actual.definition).toBe(mohioLoremIpsum.definition);
  }

  static GeneratedIdIsReturned(id) {
    expect(id).toBeDefined();
  }
}