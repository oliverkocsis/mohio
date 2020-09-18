import React, { useEffect } from 'react';
import { connect } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles';
import MohioAppBar from './MohioAppBar';
import MohioTree from './MohioTree';
import MohioView from './MohioView';
import { initializeApp } from '../store/actions';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
}));

function MohioLayout(props) {
  const classes = useStyles();
  useEffect(() => {
    props.initializeApp();
  }, []);
  return (
    <div className={classes.root}>
      <MohioAppBar></MohioAppBar>
      <MohioTree mohios={props.mohioTree}></MohioTree>
      <MohioView mohio={props.mohioView}></MohioView>
    </div>
  );
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

export default connect(mapStateToProps, actionCreators)(MohioLayout);
