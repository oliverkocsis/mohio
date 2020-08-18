import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

export const testId = 'MohioTreeElementFlat';

function MohioTreeElementFlat(props) {

  const handleClick = () => {
    props.onClick(props.name);
  };

  return <ListItem button data-testid={testId} onClick={handleClick}><ListItemText primary={props.name} /></ListItem>
}

export default MohioTreeElementFlat;