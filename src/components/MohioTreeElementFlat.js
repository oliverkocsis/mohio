import React from 'react';
import { connect } from 'react-redux';
import { selectMohio } from '../store/actons';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

export const testId = 'MohioTreeElementFlat';

function MohioTreeElementFlat(props) {

  return <ListItem button data-testid={testId} onClick={() => props.onClick(props.name)}><ListItemText primary={props.name} /></ListItem>
}

const mapDispatchToProps = dispatch => {
  return {
    onClick: name => {
      dispatch(selectMohio(name));
    }
  }
}

export default connect(null, mapDispatchToProps)(MohioTreeElementFlat);