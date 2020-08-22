import React from 'react';
import { connect } from 'react-redux'
import { createMuiTheme, makeStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';
import CssBaseline from '@material-ui/core/CssBaseline';
import MohioAppBar from './components/MohioAppBar';
import MohioTree from './components/MohioTree';
import MohioView from './components/MohioView';


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

function App(props) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <MohioAppBar></MohioAppBar>
        <MohioTree mohios={props.mohios}></MohioTree>
        <MohioView mohio={props.mohioSelected}></MohioView>
      </ThemeProvider>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    mohios: state.mohios,
    mohioSelected: state.mohioSelected,
  }
}

const appWithStore = connect(mapStateToProps)(App);

export default appWithStore;
