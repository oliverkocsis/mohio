import reducers from './reducers';
import * as actionTypes from './actionTypes';

describe('given state is undefined and no action defined when executing reducer', () => {
  beforeAll(() => {
    Given.StateIsUndefined();
    Given.ActionIsUndefined();
    When.ExecutingReducer();
  });

  test('then state conatins empty mohios list', () => {
    Then.StateContainsEmptyMohioList();
  });

  test('then state conatins empty mohios tree', () => {
    Then.StateContainsEmptyMohioTree();
  });

  test('then state conatins empty mohios view', () => {
    Then.StateContainsEmptyMohioView();
  });
});

describe('given state is empty and action is set mohio list when executing reducer ', () => {
  beforeAll(() => {
    Given.StateIsEmpty();
    Given.ActionIsSetMohioList();
    When.ExecutingReducer();
  });

  test('then state contains mohio list', () => {
    Then.StateContainsMohioList();
  });
});

describe('given state is empty and action is set mohio view explicitly when executing reducer ', () => {
  beforeAll(() => {
    Given.StateIsEmpty();
    Given.ActionIsSetMohioView();
    When.ExecutingReducer();
  });

  test('then state contains selected mohio view id', () => {
    Then.StateContainsSelectedMohioViewId();
  });
});

describe('given state contains mohio list', () => {
  beforeEach(() => {
    Given.StateIsEmpty();
    Given.StateContainsMohioList();
  });

  test('action is set mohio tree when executing reducer then state contains mohio tree', () => {
    Given.ActionIsSetMohioTree();
    When.ExecutingReducer();
    Then.StateContainsMohioTree();
  });

  test('action is set mohio view when executing reducer then state contains selected mohio view', () => {
    Given.ActionIsSetMohioView();
    When.ExecutingReducer();
    Then.StateContainsSelectedMohioView();
  });
});

describe('given state contains mohio list, mohio tree, mohio view and action is clear store when executing reducer', () => {
  beforeAll(() => {
    Given.StateIsEmpty();
    Given.StateContainsMohioList();
    Given.StateContainsMohioTree();
    Given.StateContainsMohioView();
    Given.ActionIsClearStore();
    When.ExecutingReducer();
  });

  test('then state conatins empty mohio list', () => {
    Then.StateContainsEmptyMohioList();
  });

  test('then state conatins empty mohio tree', () => {
    Then.StateContainsEmptyMohioTree();
  });

  test('then state conatins empty mohio view', () => {
    Then.StateContainsEmptyMohioView();
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

const mohioTree = [
  {
    id: mohioLoremIpsum.id,
    name: mohioLoremIpsum.name,
    children: [
      {
        id: mohioConsecteturAdipiscingElit.id,
        name: mohioConsecteturAdipiscingElit.name,
      }
    ]
  },
];

const Data = {
  state: null,
  action: null,
}

const Given = {
  StateIsUndefined: () => {
    Data.state = undefined;
  },

  StateIsEmpty: () => {
    Data.state = {
      mohios: {
        list: [],
        tree: [],
        view: null,
      },
    };
  },

  StateContainsMohioList: () => {
    Data.state.mohios.list = mohioList;
  },

  StateContainsMohioTree: () => {
    Data.state.mohios.tree = mohioTree;
  },

  StateContainsMohioView: () => {
    Data.state.mohios.view = mohioLoremIpsum;
  },

  ActionIsUndefined: () => {
    Data.action = { type: '' };
  },


  ActionIsClearStore: () => {
    Data.action = { type: actionTypes.CLEAR_STORE };
  },

  ActionIsSetMohioList: () => {
    Data.action = {
      type: actionTypes.SET_MOHIO_LIST,
      mohios: mohioList,
    };
  },

  ActionIsSetMohioTree: () => {
    Data.action = {
      type: actionTypes.SET_MOHIO_TREE,
      tree: mohioTree,
    };
  },

  ActionIsSetMohioView: () => {
    Data.action = {
      type: actionTypes.SET_MOHIO_VIEW,
      id: mohioConsecteturAdipiscingElit.id,
    };
  },

}

const When = {
  ExecutingReducer: () => {
    Data.state = reducers(Data.state, Data.action);
  },
}

const Then = {
  StateContainsEmptyMohioList: () => {
    expect(Data.state.mohios.list.length).toBe(0);
  },

  StateContainsEmptyMohioTree: () => {
    expect(Data.state.mohios.tree.length).toBe(0);
  },

  StateContainsEmptyMohioView: () => {
    expect(Data.state.mohios.view).toBeNull();
  },

  StateContainsMohioList: () => {
    expect(Data.state.mohios.list).toStrictEqual(mohioList);
  },

  StateContainsMohioTree: () => {
    expect(Data.state.mohios.tree).toStrictEqual(mohioTree);
  },

  StateContainsDefaultMohioView: () => {
    expect(Data.state.mohios.view).toStrictEqual(mohioLoremIpsum);
  },

  StateContainsSelectedMohioView: () => {
    expect(Data.state.mohios.view).toStrictEqual(mohioConsecteturAdipiscingElit);
  },

  StateContainsSelectedMohioViewId: () => {
    expect(Data.state.mohios.view.id).toBe(mohioConsecteturAdipiscingElit.id);
    expect(Data.state.mohios.view.definition).toBeUndefined();
  },
}