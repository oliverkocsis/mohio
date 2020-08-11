import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MohioTreeElementFlat from './MohioTreeElementFlat';

export const testId = 'MohioTreeElementMultiLevel';

const useStyles = makeStyles((theme) => ({
  nested: {
    paddingLeft: theme.spacing(4),
  },
}));

function MohioTreeElementMultiLevel(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);
  const handleClick = () => {
    setOpen(!open);
  };
  const children = props.children.map((child) => <MohioTreeElementFlat name={child.name} key={child.name} />);
  return (
    <List disablePadding dense={true} data-testid={testId}>
      <ListItem button onClick={handleClick}>
        <ListItemText primary={props.name} />{open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding dense={true}>
          {children}
        </List>
      </Collapse>
    </List>
  )
}

export default MohioTreeElementMultiLevel;