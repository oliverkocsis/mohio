import React from 'react';
import { connect } from 'react-redux';
import { setMohioView } from '../store/actions';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

function MohioTreeElementFlat(props) {
  const mohio = props.mohio;
  return <ListItem button onClick={() => props.selectMohio(mohio.id)}><ListItemText primary={mohio.name} /></ListItem>
}

const actionCreators = {
  selectMohio: setMohioView,
}

export default connect(null, actionCreators)(MohioTreeElementFlat);