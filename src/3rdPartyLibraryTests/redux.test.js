import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

const INCREMENT_BY_AMOUNT = 'INCREMENT_BY_AMOUNT';

function incrementByAmount(amount) {
  return {
    type: INCREMENT_BY_AMOUNT,
    amount: amount,
  }
}

function incrementAsync(amount) {
  return (dispatch) => {
    setTimeout(() => {
      dispatch(incrementByAmount(amount))
    }, 500)
  }
}

const initialState = {
  counter: 0,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    case INCREMENT_BY_AMOUNT:
      return {
        ...state,
        counter: state.counter + action.amount,
      }
    default:
      return state
  }
}

const getCounter = () => store.getState().counter;

const store = createStore(reducer, applyMiddleware(thunk));
let unsubscribe;

beforeEach(() => {
  unsubscribe = () => { }
});

test('can test end-to-end', (done) => {
  expect(getCounter()).toBe(0);
  const amount = Math.floor(Math.random() * 100);
  unsubscribe = store.subscribe(() => {
    expect(getCounter()).toBe(amount);
    done();
  });
  store.dispatch(incrementAsync(amount));
});

afterEach(() => {
  unsubscribe();
});

