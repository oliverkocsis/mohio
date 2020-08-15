import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

export const testId = 'MohioTreeElementFlat';

function MohioTreeElementFlat(props) {
  return <ListItem button data-testid={testId}><ListItemText primary={props.name} /></ListItem>
}

export default MohioTreeElementFlat;