import React from 'react';
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles';
import MohioAppBar from './MohioAppBar';
import MohioTree from './MohioTree';
import MohioView from './MohioView';
import { initializeApp } from '../store/actions';

const styles = {
  root: {
    display: 'flex',
  },
};

class MohioLayout extends React.Component {

  constructor(props) {
    super(props);
    const { classes } = props;
    this.classes = classes;
  }

  componentDidMount() {
    console.log('initializeApp');
    this.props.initializeApp();
  }

  render() {
    return (
      <div className={this.classes.root}>
        <MohioAppBar></MohioAppBar>
        <MohioTree mohios={this.props.mohioTree}></MohioTree>
        <MohioView mohio={this.props.mohioView}></MohioView>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    mohioTree: state.mohios.tree,
    mohioView: state.mohios.view,
  }
}

const actionCreators = {
  initializeApp,
}

const mohioLayoutWithStore = connect(mapStateToProps, actionCreators)(MohioLayout);
const mohioLayoutWithStyle = withStyles(styles)(mohioLayoutWithStore);

export default mohioLayoutWithStyle;