import reducers from './reducers';
import * as actionTypes from './actionTypes';

const mohios = [
  {
    id: 'd40d3ece',
    name: 'Lorem Ipsum',
    definition: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
  },
  {
    id: 'ab7d71ba',
    name: 'Cras ut ornare arcu',
    definition: 'Aenean tellus ante, congue quis eros vel, interdum porta velit',
  }
];

const emptyState = {
  mohios: [],
  mohioSelected: null,
}

const notEmptyState = {
  mohios: mohios,
  mohioSelected: mohios[0],
}

test('the initial state shall be empty', () => {
  const state = reducers(undefined, { type: '' });
  expect(state).toStrictEqual(emptyState);
});

test('set mohios shall set the mohios and shall set the selected item to the first element', () => {
  const action = {
    type: actionTypes.SET_MOHIOS,
    mohios: mohios,
  };
  const state = reducers(emptyState, action);
  expect(state).toStrictEqual(notEmptyState);
});

test('select mohio shall find the mohio by id and set as selected', () => {
  const action = {
    type: actionTypes.SELECT_MOHIO,
    id: mohios[1].id,
  };
  const state = reducers(notEmptyState, action);
  expect(state).toStrictEqual({
    mohios: mohios,
    mohioSelected: mohios[1],
  });
});
