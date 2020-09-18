import * as repository from './mohioRepository';
import { Given as GivenFirestoreClass } from './firebase/firestore.bdd';

export const rootMohio = {
  name: 'Lorem Ipsum',
  definition: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
}

export const childMohio = {
  name: 'Praesent Luctus',
  definition: 'Praesent luctus tortor vel metus tempor, et egestas enim accumsan.',
}

export const childOfChildMohio = {
  name: "Class Aptent",
  definition: "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
}

export class Given {
  constructor() {
    this.GivenFirestore = new GivenFirestoreClass();
    this.rootMohioId = null;
    this.childMohioId = null;
    this.childOfChildMohioId = null;
  }

  async RepositoryIsEmpty() {
    return this.GivenFirestore.FirestoreIsEmpty();
  }

  async RootMohioIsCreated() {
    this.rootMohioId = await repository.create(rootMohio);
    return this.rootMohioId;
  }

  async ChildMohioIsCreated() {
    this.childMohioId = await repository.create(childMohio, this.rootMohioId);
    return this.childMohioId;
  }

  async ChildOfChildMohioIsCreated() {
    this.childOfChildMohioId = await repository.create(childOfChildMohio, this.childMohioId);
    return this.childOfChildMohioId;
  }

}

export class When {

  constructor() {
    this.Given = new Given();
  }

  async ReadingMohios() {
    return repository.readMohios();
  }

  async ReadingRoots() {
    return repository.readRoots();
  }

  async ReadingMohio(id) {
    return repository.readMohio(id);
  }

  async CreatingMohio() {
    return repository.create(rootMohio);
  }
}

export class Then {

  MohiosIsEmpty(mohios) {
    expect(mohios.length).toBe(0);
  }

  RootsIsEmpty(roots) {
    expect(roots.length).toBe(0);
  }

  IdIsReturned(id) {
    expect(id).toBeDefined();
  }

  MohiosContainsMohio(mohios, expected) {
    const actual = mohios.find((mohio) => expected.id === mohio.id);
    expect(actual).toStrictEqual(expected);
  }

  RootsContainsMohioId(roots, id) {
    expect(roots.includes(id)).toBeTruthy();
  }

  RootMohioIsReturned(mohio, id) {
    expect(mohio).toStrictEqual({
      id: id,
      ...rootMohio,
    });
  }

  RootMohioWithChildrenIsReturned(mohio, id, children) {
    expect(mohio).toStrictEqual({
      id: id,
      ...rootMohio,
      children: children,
    });
  }

  ChildMohioIsReturned(mohio, id) {
    expect(mohio).toStrictEqual({
      id: id,
      ...childMohio,
    });
  }

  RootsDoesNotContainMohioId(roots, id) {
    expect(roots.includes(id)).toBeFalsy();
  }

}