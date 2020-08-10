import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

function MohioTreeElementFlat(props) {
  return <ListItem button><ListItemText primary={props.name} /></ListItem>
}

export default MohioTreeElementFlat;