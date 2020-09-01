import * as actionTypes from './actionTypes';

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

const initialState = {
  mohios: [],
  mohioSelected: null,
}

function reducers(state = initialState, action) {
  switch (action.type) {
    case actionTypes.SET_MOHIOS:
      return reduceSetMohios(state, action);
    case actionTypes.SELECT_MOHIO:
      return reduceSelectMohio(state, action);
    default:
      return state
  }
}

export default reducers;

function reduceSetMohios(state, action) {
  const mohios = action.mohios;
  return {
    ...state,
    mohios: mohios,
    mohioSelected: mohios[0]
  }
}

function reduceSelectMohio(state, action) {
  return {
    ...state,
    mohioSelected: select(state.mohios, action.id)
  }
}

function findMohio(mohio, id) {
  if (mohio.id === id) {
    return mohio;
  } else {
    if (mohio.children) {
      for (let child of mohio.children) {
        const found = findMohio(child, id);
        if (found) {
          return found;
        }
      }
    }
  }
}

function select(mohios, id) {
  for (let mohio of mohios) {
    const found = findMohio(mohio, id);
    if (found) {
      return found;
    }
  }
}