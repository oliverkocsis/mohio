import React from 'react';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderComponentWithStore, createMockStoreWithState } from './ComponentTestUtils';

import MohioTreeElementMultiLevel from './MohioTreeElementMultiLevel';
import { selectMohio } from '../store/actions'

let store;
const mohio = {
  id: 'a012e594-46b0-44ba-a4eb-76b6a0fd8680',
  name: 'MohioTreeElementMultiLevel',
  children: [
    {
      id: 'ab96e45b-aff4-4799-9d44-5ec3dd9bda2a',
      name: 'Child One',
    },
    {
      id: 'd0758576-8c9a-4a2f-89fb-2b3fe40b069c',
      name: 'Child Two',
      children: [
        {
          id: '02a98121-abf6-4b79-96ab-0c22bfd6b1b6',
          name: 'Child Of Child Two',
        }
      ]
    }
  ]
};

beforeEach(() => {
  store = createMockStoreWithState();
  renderComponentWithStore(<MohioTreeElementMultiLevel mohio={mohio} />, store);
});

test('when component is rendered then name is displayed', () => {
  expectComponentToBeInDocument();
});

test('when component is rendered then name of children are not displayed', () => {
  expectChildrenComponentNotToBeInDocument();
});

describe('when clicking on a component', () => {
  beforeEach(async () => {
    store.dispatch.mockClear();
    const element = screen.getByText(mohio.name);
    userEvent.click(element);
    return screen.findByText(mohio.children[0].name);
  });

  test('then select mohio action is dispatched', () => {
    const dispatched = store.dispatch.mock.calls[0];
    expect(dispatched[0]).toStrictEqual(selectMohio(mohio.id));
  });

  test('then component is displayed', () => {
    expectComponentToBeInDocument();
  });

  test('then children of component are displayed', () => {
    expectChildrenComponentToBeInDocument();
  });

  test('then children of children of component are not displayed', () => {
    expectChildrenOfChildrenComponentNotToBeInDocument();
  });

  describe('when clicking on child of a child component', () => {
    beforeEach(async () => {
      store.dispatch.mockClear();
      const element = screen.getByText(mohio.children[1].name);
      userEvent.click(element);
      return screen.findByText(mohio.children[1].children[0].name);
    });

    test('then select mohio action is dispatched', () => {
      const dispatched = store.dispatch.mock.calls[0];
      expect(dispatched[0]).toStrictEqual(selectMohio(mohio.children[1].id));
    });

    test('then component is displayed', () => {
      expectComponentToBeInDocument();
    });

    test('then children of component are displayed', () => {
      expectChildrenComponentToBeInDocument();
    });

    test('then children of children of component are displayed', () => {
      expectChildrenOfChildrenComponentToBeInDocument();
    });
  });

  describe('when clicking on a component twice', () => {
    beforeEach(async () => {
      store.dispatch.mockClear();
      const element = screen.getByText(mohio.name);
      userEvent.click(element);
      return waitForElementToBeRemoved(() => screen.queryByText(mohio.children[0].name));
    });

    test('then select mohio action is dispatched twice', () => {
      const dispatchedOne = store.dispatch.mock.calls[0];
      expect(dispatchedOne[0]).toStrictEqual(selectMohio(mohio.id));
    });

    test('when component is rendered then name is displayed', () => {
      expectComponentToBeInDocument();
    });

    test('when component is rendered then name of children are not displayed', () => {
      expectChildrenComponentNotToBeInDocument();
    });
  });
});


const expectComponentToBeInDocument = () => {
  const component = screen.getByText(mohio.name);
  expect(component).toBeInTheDocument();
};

const expectChildrenComponentToBeInDocument = () => {
  const childOne = screen.getByText(mohio.children[0].name)
  expect(childOne).toBeInTheDocument();
  const childTwo = screen.getByText(mohio.children[1].name)
  expect(childTwo).toBeInTheDocument();
};

const expectChildrenComponentNotToBeInDocument = () => {
  const childOne = screen.queryByText(mohio.children[0].name)
  expect(childOne).toBeNull();
  const childTwo = screen.queryByText(mohio.children[1].name)
  expect(childTwo).toBeNull();
};

const expectChildrenOfChildrenComponentToBeInDocument = () => {
  const childOfChildTwo = screen.getByText(mohio.children[1].children[0].name);
  expect(childOfChildTwo).toBeInTheDocument();
};

const expectChildrenOfChildrenComponentNotToBeInDocument = () => {
  const childOfChildTwo = screen.queryByText(mohio.children[1].children[0].name);
  expect(childOfChildTwo).toBeNull();
};