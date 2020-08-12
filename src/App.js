import React from 'react';
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';
import CssBaseline from '@material-ui/core/CssBaseline';
import MohioAppBar from './MohioAppBar';
import MohioTree from './MohioTree';
import MohioView from './MohioView';

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent elementum facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in hendrerit gravida rutrum quisque non tellus. Convallis convallis tellus id interdum velit laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus at augue. At augue eget arcu dictum varius duis at consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa sapien faucibus et molestie ac.';

const mohios = [
  { name: 'About', value: loremIpsum },
  {
    name: 'Domain', value: loremIpsum, children: [
      { name: 'Bar', value: loremIpsum },
      { name: 'Tree', value: loremIpsum },
      { name: 'View', value: loremIpsum },
    ]
  },
  {
    name: 'Process', value: loremIpsum, children: [
      { name: 'Create', value: loremIpsum },
      { name: 'Edit', value: loremIpsum },
      { name: 'Delete', value: loremIpsum },
    ]
  },
];

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
