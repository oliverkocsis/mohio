import React from 'react'
import { render as testingLibraryRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import store from "../store/store";

function renderWithStore(ui) {
  return testingLibraryRender(<Provider store={store}>{ui}</Provider>);
}

export { renderWithStore }