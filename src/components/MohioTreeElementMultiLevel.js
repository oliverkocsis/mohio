import React from 'react';
import { connect } from 'react-redux';
import { selectMohio } from '../store/actons';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MohioTreeElement from './MohioTreeElement';

export const testId = 'MohioTreeElementMultiLevel';

const useStyles = makeStyles((theme) => ({
  nested: {
    paddingLeft: theme.spacing(2),
  },
}));

function MohioTreeElementMultiLevel(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const handleClick = () => {
    setOpen(!open);
    props.onClick(props.name);
  };
  const children = props.children.map((child) => <MohioTreeElement name={child.name} children={child.children} key={child.name} />);
  return (
    <List disablePadding dense={true} data-testid={testId}>
      <ListItem button onClick={handleClick}>
        <ListItemText primary={props.name} />{open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding dense={true} className={classes.nested}>
          {children}
        </List>
      </Collapse>
    </List>
  )
}

const mapDispatchToProps = dispatch => {
  return {
    onClick: name => {
      dispatch(selectMohio(name));
    }
  }
}

export default connect(null, mapDispatchToProps)(MohioTreeElementMultiLevel);