import store from "./store";
import * as actions from './actions';
import * as mohioRepository from '../repository/mohioRepository'

describe('when new store is created', () => {
  test('then state conatins empty mohios list', () => {
    Then.StateContainsEmptyMohioList();
  });

  test('then state conatins empty mohios tree', () => {
    Then.StateContainsEmptyMohioTree();
  });

  test('then state conatins empty mohios view', () => {
    Then.StateContainsEmptyMohioView();
  });

  describe('given mohio list in firestore and mohio tree in firestore', () => {

  });
});

const mohioLoremIpsum = {
  id: '62c57e62-dc98-4457-a070-25240493bf1d',
  name: 'Lorem ipsum',
  definition: 'Lorem ipsum dolor sit amet',
}

const mohioConsecteturAdipiscingElit = {
  id: 'f05099ad-34b0-45dd-a157-5bf9edc72511',
  name: 'Consectetur adipiscing elit',
  definition: 'Vivamus in eleifend tortor',
}

const mohioList = [
  mohioLoremIpsum,
  mohioConsecteturAdipiscingElit,
];

const mohioIdTree = [
  {
    id: mohioLoremIpsum.id,
    children: [
      {
        id: mohioConsecteturAdipiscingElit.id,
      }
    ]
  },
];

const mohioTree = [
  {
    ...mohioLoremIpsum,
    children: [
      {
        ...mohioConsecteturAdipiscingElit,
      }
    ]
  },
];

const Given = {
  StoreIsEmpty: () => {
    return store.dispatch(actions.clearStore());
  },

  RepositoryIsEmpty: async () => {
    return GivenMohioRepository.RepositoryIsEmpty();
  },

  MohiosAreCreatedInRepository: async () => {
    return GivenMohioRepository.MohiosAreCreatedInRepository();
  },

  ComponentIsRenderedWithStore: async (component) => {
    return render(<Provider store={store}>{component}</Provider>);
  },
}

const When = {
  DispatchingReadMohiosFromRepositoryAction(then, done) {
    const unsubscribe = store.subscribe(() => {
      if (then) then();
      unsubscribe();
      if (done) done();
    });
    store.dispatch(actions.initializeApp());
  }
}

const Then = {
  StateContainsEmptyMohioList: () => {
    expect(getMohioList().length).toBe(0);
  },
  StateContainsEmptyMohioTree: () => {
    expect(getMohioTree().length).toBe(0);
  },
  StateContainsEmptyMohioView: () => {
    expect(getMohioView()).toBeNull();
  },

  StateContainsMohios: () => {
    expect(Then.getMohios().length).toBe(2);
  },
  StateContainsSelectedMohio: () => {
    expect(Then.getMohioSelected()).not.toBeNull();
  },
}

const getMohioList = () => {
  return store.getState().mohios.list;
};
const getMohioTree = () => {
  return store.getState().mohios.tree;
};
const getMohioView = () => {
  return store.getState().mohios.view;
};

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent elementum facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in hendrerit gravida rutrum quisque non tellus. Convallis convallis tellus id interdum velit laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus at augue. At augue eget arcu dictum varius duis at consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa sapien faucibus et molestie ac.';

const mohios = [
  { name: 'About', definition: loremIpsum },
  {
    name: 'Domain', definition: loremIpsum, children: [
      { name: 'Bar', definition: loremIpsum },
      { name: 'Tree', definition: loremIpsum },
      {
        name: 'View', definition: loremIpsum, children: [
          { name: 'Name', definition: loremIpsum },
          { name: 'Value', definition: loremIpsum },
        ]
      },
    ]
  },
  {
    name: 'Process', definition: loremIpsum, children: [
      { name: 'Create', definition: loremIpsum },
      { name: 'Edit', definition: loremIpsum },
      { name: 'Delete', definition: loremIpsum },
    ]
  },
];