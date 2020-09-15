import { Given as GivenClass, When as WhenClass, Then as ThenClass } from './mohioRepository.bdd'

const Given = new GivenClass();
const When = new WhenClass();
const Then = new ThenClass();

describe('given repository is empty', () => {

  beforeAll(async () => {
    return Given.RepositoryIsEmpty();
  });

  test('when reading mohios list then mohios is empty', async () => {
    const mohios = await When.ReadingMohios();
    Then.MohiosIsEmpty(mohios);
  });

  test('when reading roots then roots is empty', async () => {
    const roots = await When.ReadingRoots();
    Then.RootsIsEmpty(roots);
  });

  test('when creating mohio then id is returned', async () => {
    const id = await When.CreatingMohio();
    Then.IdIsReturned(id);
  });

});

describe('given a root mohio is created', () => {

  let rootMohioId = null;
  let rootMohio = null;

  beforeAll(async () => {
    await Given.RepositoryIsEmpty();
    rootMohioId = await Given.RootMohioIsCreated();
  });

  test('when reading root mohio then root mohio is returned', async () => {
    rootMohio = await When.ReadingMohio(rootMohioId);
    Then.RootMohioIsReturned(rootMohio, rootMohioId);
  });

  test('when reading mohios then mohios contains root mohio', async () => {
    const mohios = await When.ReadingMohios();
    Then.MohiosContainsMohio(mohios, rootMohio);
  });

  test('when reading roots then roots contains root mohio', async () => {
    const roots = await When.ReadingRoots();
    Then.RootsContainsMohioId(roots, rootMohioId);
  });

  describe('given a child mohio is created', () => {
    
    let childMohioId;
    let childMohio;

    beforeAll(async () => {
      childMohioId = await Given.ChildMohioIsCreated();
    });  

    test('when reading child mohio then child mohio is returned', async () => {
      childMohio = await When.ReadingMohio(childMohioId);
      Then.ChildMohioIsReturned(childMohio, childMohioId);
    });

    test('when reading root mohio then root mohio with children is returned', async () => {
      rootMohio = await When.ReadingMohio(rootMohioId);
      Then.RootMohioWithChildrenIsReturned(rootMohio, rootMohioId, [childMohioId]);
    });

    describe('when reading mohios', () => {

      let mohios;

      beforeAll(async () => {
        mohios = await When.ReadingMohios();
      });

      test('then mohios contains root mohio', () => {
        Then.MohiosContainsMohio(mohios, rootMohio);
      });

      test('then mohios contains child mohio', () => {
        Then.MohiosContainsMohio(mohios, childMohio);
      });
    });

    describe('when reading roots', () => {

      let roots;

      beforeAll(async () => {
        roots = await When.ReadingRoots();
      });

      test('then roots contains root mohio', () => {
        Then.RootsContainsMohioId(roots, rootMohioId);
      });

      test('then roots does not contain child mohio', () => {
        Then.RootsDoesNotContainMohioId(roots, childMohioId);
      });
    });
  });
});


