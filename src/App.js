import React from 'react';
import { Provider } from 'react-redux'
import store from "./store/store";

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';
import CssBaseline from '@material-ui/core/CssBaseline';
import MohioLayout from './components/MohioLayout';
import { BrowserRouter as Router } from "react-router-dom";

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink,
  },
});

function App(props) {
  return (
    <Provider store={store}>
      <Router>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <MohioLayout />
        </ThemeProvider>
      </Router>
    </Provider>
  );
}

export default App;
