import React from 'react';
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';
import CssBaseline from '@material-ui/core/CssBaseline';
import MohioAppBar from './MohioAppBar';
import MohioTree from './MohioTree';
import MohioView from './MohioView';
import mohios from './MohioTreeExample';

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink,
  },
});

const styles = {
  root: {
    display: 'flex',
  },
};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      mohios: mohios,
      mohioSelected: mohios[0],
    };
    this.classes = props.classes;
  }
  render() {
    return (
      <div className={this.classes.root}>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <MohioAppBar></MohioAppBar>
          <MohioTree mohios={this.state.mohios}></MohioTree>
          <MohioView mohio={this.state.mohioSelected}></MohioView>
        </ThemeProvider>
      </div >
    );
  }
}

export default withStyles(styles)(App);
