import React from 'react';
import { createMuiTheme, makeStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';
import CssBaseline from '@material-ui/core/CssBaseline';
import MohioAppBar from './MohioAppBar';
import MohioTree from './MohioTree';
import MohioView from './MohioView';

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink,
  },
});

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
}));


function App() {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <MohioAppBar></MohioAppBar>
        <MohioTree></MohioTree>
        <MohioView></MohioView>
      </ThemeProvider>
    </div>
  );
}

export default App;
