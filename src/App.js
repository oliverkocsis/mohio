import React from 'react';
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import blue from '@material-ui/core/colors/blue';
import pink from '@material-ui/core/colors/pink';
import CssBaseline from '@material-ui/core/CssBaseline';
import MohioAppBar from './components/MohioAppBar';
import MohioTree from './components/MohioTree';
import MohioView from './components/MohioView';

const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent elementum facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in hendrerit gravida rutrum quisque non tellus. Convallis convallis tellus id interdum velit laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus at augue. At augue eget arcu dictum varius duis at consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa sapien faucibus et molestie ac.';

const mohios = [
  { name: 'About', definition: loremIpsum },
  {
    name: 'Domain', definition: loremIpsum, children: [
      { name: 'Bar', definition: loremIpsum },
      { name: 'Tree', definition: loremIpsum },
      {
        name: 'View', definition: loremIpsum, children: [
          { name: 'Name', definition: loremIpsum },
          { name: 'Value', definition: loremIpsum },
        ]
      },
    ]
  },
  {
    name: 'Process', definition: loremIpsum, children: [
      { name: 'Create', definition: loremIpsum },
      { name: 'Edit', definition: loremIpsum },
      { name: 'Delete', definition: loremIpsum },
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

  select(name) {
    for (let mohio of this.state.mohios) {
      const found = this.findMohio(mohio, name);
      if (found) {
        this.setState({ mohioSelected: found });
        return;
      }
    }
  }

  findMohio(mohio, name) {
    if (mohio.name === name) {
      return mohio;
    } else {
      if (mohio.children) {
        for (let child of mohio.children) {
          const found = this.findMohio(child, name);
          if (found) {
            return found;
          }
        }
      }
    }
  }

  render() {
    return (
      <div className={this.classes.root}>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <MohioAppBar></MohioAppBar>
          <MohioTree mohios={this.state.mohios} onClick={this.select.bind(this)}></MohioTree>
          <MohioView mohio={this.state.mohioSelected}></MohioView>
        </ThemeProvider>
      </div >
    );
  }
}

export default withStyles(styles)(App);
