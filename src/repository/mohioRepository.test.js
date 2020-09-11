import * as repository from './mohioRepository';
import { clearFirestore } from './firebase/firestore.testutil';

describe('given repository is empty', () => {

  beforeEach(async () => {
    await Given.RepositoryIsEmpty();
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
    let rootId;

    beforeEach(async () => {
      rootId = await Given.RootMohioIsCreated();
    });

    test('when reading mohios then mohios contains root mohio', async () => {
      const mohios = await When.ReadingMohios();
      Then.MohiosContainsMohio(mohios, mohioLoremIpsum, rootId);
    });

    test('when reading roots then roots contains root mohio', async () => {
      const roots = await When.ReadingRoots();
      Then.RootsContainsId(roots, rootId);
    });

    test('when reading existing mohio then mohio is returned', async () => {
      const mohio = await When.ReadingMohio(rootId);
      Then.MohioIsReturned(mohio, rootId);
    });

    describe('given a child mohio is created', () => {
      let childId;

      beforeEach(async () => {
        childId = await Given.ChildMohioIsCreatedy(rootId);
      });

      describe('when reading mohios', () => {

        let mohios;

        beforeEach(async () => {
          mohios = await When.ReadingMohios();
        });

        test('then mohios contains root mohio', () => {
          Then.MohiosContainsMohio(mohios, mohioLoremIpsum, rootId);
        });

        test('then mohios contains child mohio', () => {
          Then.MohiosContainsMohio(mohios, mohioConsecteturAdipiscingElit, childId);
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

const mohioLoremIpsum = {
  name: 'Lorem ipsum',
  definition: 'Lorem ipsum dolor sit amet',
}

const mohioConsecteturAdipiscingElit = {
  name: 'Consectetur adipiscing elit',
  definition: 'Vivamus in eleifend tortor',
}

const Given = {
  RepositoryIsEmpty: async () => {
    return clearFirestore();
  },

  RootMohioIsCreated: async () => {
    return repository.create(mohioLoremIpsum);
  },

  ChildMohioIsCreatedy: async (parentId) => {
    return repository.create(mohioConsecteturAdipiscingElit, parentId);
  },
}

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
    return repository.create(mohioLoremIpsum);
  },
}

const Then = {
  MohiosIsEmpty(mohios) {
    expect(mohios.length).toBe(0);
  },

  RootsIsEmpty(roots) {
    expect(roots.length).toBe(0);
  },

  MohiosContainsMohio(mohios, mohio, id) {
    const actual = mohios.find((mohio) => id === mohio.id);
    expect(actual.id).toBe(id);
    expect(actual.name).toBe(mohio.name);
    expect(actual.definition).toBe(mohio.definition);
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

  MohioIsReturned(mohio, id) {
    expect(mohio.id).toBe(id);
    expect(mohio.name).toBe(mohioLoremIpsum.name);
    expect(mohio.definition).toBe(mohioLoremIpsum.definition);
  },
}