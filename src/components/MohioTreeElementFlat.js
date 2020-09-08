import React from 'react';
import { connect } from 'react-redux';
import { selectMohio } from '../store/actions';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

export const testId = 'MohioTreeElementFlat';

function MohioTreeElementFlat(props) {
  const mohio = props.mohio;
  return <ListItem button data-testid={testId} onClick={() => props.selectMohio(mohio.id)}><ListItemText primary={mohio.name} /></ListItem>
}

const actionCreators = {
  selectMohio,
}

export default connect(null, actionCreators)(MohioTreeElementFlat);