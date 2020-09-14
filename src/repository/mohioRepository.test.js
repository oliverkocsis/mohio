import * as repository from './mohioRepository';

import { Given as GivenMohioRepositoryClass } from '../e2e/mohioRepository.bdd'

describe('given repository is empty', () => {

  beforeEach(async () => {
    return GivenMohioRepository.RepositoryIsEmpty();
  });

  test('when reading mohios list then mohios is empty', async () => {
    const list = await When.ReadingMohios();
    Then.MohiosIsEmpty(list);
  });

  test('when reading roots then roots is empty', async () => {
    const roots = await When.ReadingRoots();
    Then.RootsIsEmpty(roots);
  });

  test('when creating new mohio then id is returned', async () => {
    const id = await When.CreatingMohioInRepository()
    Then.IdIsReturned(id);
  });

  describe('given a root mohio is created', () => {

    beforeEach(async () => {
      await GivenMohioRepository.RootMohioIsCreated();
    });

    test('when reading mohios then mohios contains root mohio', async () => {
      const mohios = await When.ReadingMohios();
      Then.MohiosContainsMohio(mohios, GivenMohioRepository.rootMohio);
    });

    test('when reading roots then roots contains root mohio', async () => {
      const roots = await When.ReadingRoots();
      Then.RootsContainsId(roots, GivenMohioRepository.rootMohioId);
    });

    test('when reading existing mohio then mohio is returned', async () => {
      const mohio = await When.ReadingMohio(GivenMohioRepository.rootMohioId);
      Then.MohioIsReturned(mohio, GivenMohioRepository.rootMohio);
    });

    describe('given a child mohio is created', () => {
      let childId;

      beforeEach(async () => {
        childId = await GivenMohioRepository.ChildOfRootMohioIsCreatedy();
      });

      describe('when reading mohios', () => {

        let mohios;

        beforeEach(async () => {
          mohios = await When.ReadingMohios();
        });

        test('then mohios contains root mohio', () => {
          Then.MohiosContainsMohio(mohios, GivenMohioRepository.rootMohio);
        });

        test('then mohios contains child mohio', () => {
          Then.MohiosContainsMohio(mohios, GivenMohioRepository.childOfRootMohio);
        });
      });

      describe('when reading roots', () => {

        let roots;

        beforeEach(async () => {
          roots = await When.ReadingRoots();
        });

        test('then roots contains root mohio', () => {
          Then.RootsContainsId(roots, rootId);
        });

        test('then roots does not contain child mohio', () => {
          Then.RootsDoesNotContainId(roots, childId);
        });
      });
    });
  });
});

const GivenMohioRepository = new GivenMohioRepositoryClass();

const When = {
  ReadingMohios: async () => {
    return repository.readMohios();
  },

  ReadingMohio: async (id) => {
    return repository.readMohio(id);
  },

  ReadingRoots: async () => {
    return repository.readRoots();
  },

  CreatingMohioInRepository: async () => {
    return GivenMohioRepository.RootMohioIsCreated();
  },
}

const Then = {
  MohiosIsEmpty(mohios) {
    expect(mohios.length).toBe(0);
  },

  RootsIsEmpty(roots) {
    expect(roots.length).toBe(0);
  },

  MohiosContainsMohio(mohios, expected) {
    const actual = mohios.find((mohio) => expected.id === mohio.id);
    MohioIsReturned(actual, expected);
  },

  RootsContainsId(roots, id) {
    expect(roots.includes(id)).toBeTruthy();
  },

  RootsDoesNotContainId(roots, id) {
    expect(roots.includes(id)).toBeFalsy();
  },

  IdIsReturned(id) {
    expect(id).toBeDefined();
  },

  MohioIsReturned(actual, expected) {
    expect(actual.id).toBe(expected.id);
    expect(actual.name).toBe(expected.name);
    expect(actual.definition).toBe(expected.definition);
  },
}