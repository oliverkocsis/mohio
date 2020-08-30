import * as repository from './mohio';
import { clearFirestoreEmulator } from './firebase/firestore.test';

const mohio = {
  name: 'Lorem ipsum',
  definition: 'Lorem ipsum dolor sit amet'
}

beforeEach(() => {
  return clearFirestoreEmulator();
});

test('the repository is empty by default', () => {
  return repository.read().then((mohios) => {
    expect(mohios.length).toBe(0);
  });
});

test('can create mohio', () => {
  return repository.create(mohio).then((docRef) => {
    expect(docRef.id).toBeDefined();
  });
});

test('can read mohio', () => {
  let id;
  return repository.create(mohio)
    .then((docRef) => {
      id = docRef.id;
      return repository.read();
    })
    .then((mohios) => {
      expect(mohios.length).toBe(1);
      const actual = mohios[0];
      expect(actual.id).toBe(id);
      expect(actual.name).toBe(mohio.name);
      expect(actual.definition).toBe(mohio.definition);
    });
});