import * as repository from './mohioRepository';
import { Given as GivenFirestore } from './firebase/firestore.bdd';

export const mohioLoremIpsum = {
  name: 'Lorem ipsum',
  definition: 'Lorem ipsum dolor sit amet',
}

export const mohioConsecteturAdipiscingElit = {
  name: 'Consectetur adipiscing elit',
  definition: 'Vivamus in eleifend tortor',
}

export class Given {
  static async RepositoryIsEmpty() {
    return GivenFirestore.FirestoreIsEmpty();
  }

  static async MohioIsCreatedInRepository() {
    return repository.create(mohioLoremIpsum);
  }

  static async MohiosAreCreatedInRepository() {
    await repository.create(mohioLoremIpsum);
    return repository.create(mohioConsecteturAdipiscingElit);
  }
}

export class When {
  static async ReadingMohios() {
    return repository.read();
  }

  static async CreatingMohioInRepository() {
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