import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from "react-router";
import { withStyles } from '@material-ui/core/styles';
import MohioAppBar from './MohioAppBar';
import MohioTree from './MohioTree';
import MohioView from './MohioView';
import { initializeApp, selectMohio } from '../store/actions';

const styles = {
  root: {
    display: 'flex',
  },
};

class MohioLayout extends React.Component {

  constructor(props) {
    super();
    const { classes } = props;
    this.classes = classes;
    const { match } = this.props;
    this.id = match.params.id;
  }

  componentDidMount() {
    this.props.initializeApp();
    if (this.id) {
      this.props.selectMohio(this.id);
    };
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
  selectMohio,
}

const mohioLayoutWithStore = connect(mapStateToProps, actionCreators)(MohioLayout);
const mohioLayoutWithStyle = withStyles(styles)(mohioLayoutWithStore);
const mohioLayoutWithRouter = withRouter(mohioLayoutWithStyle);

export default mohioLayoutWithRouter;