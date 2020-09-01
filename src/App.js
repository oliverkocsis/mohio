import React from 'react';
import { connect } from 'react-redux'
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';
import CssBaseline from '@material-ui/core/CssBaseline';
import { readMohiosFromRepository } from './store/actions';
import MohioAppBar from './components/MohioAppBar';
import MohioTree from './components/MohioTree';
import MohioView from './components/MohioView';


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
    const { classes } = props;
    this.classes = classes;
  }

  componentDidMount() {
    this.props.readMohiosFromRepository();
  }

  render() {
    return (
      <div className={this.classes.root}>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <MohioAppBar></MohioAppBar>
          <MohioTree mohios={this.props.mohios}></MohioTree>
          <MohioView mohio={this.props.mohioSelected}></MohioView>
        </ThemeProvider>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    mohios: state.mohios,
    mohioSelected: state.mohioSelected,
  }
}

const actionCreators = {
  readMohiosFromRepository,
}

const appWithStore = connect(mapStateToProps, actionCreators)(App);
const appWithStyle = withStyles(styles)(appWithStore);

export default appWithStyle;
