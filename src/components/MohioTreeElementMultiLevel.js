import React from 'react';
import { connect } from 'react-redux';
import { setMohioView } from '../store/actions';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MohioTreeElement from './MohioTreeElement';

const useStyles = makeStyles((theme) => ({
  nested: {
    paddingLeft: theme.spacing(2),
  },
}));

function MohioTreeElementMultiLevel(props) {
  const mohio = props.mohio;
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const handleClick = () => {
    setOpen(!open);
    props.selectMohio(mohio.id);
  };
  const children = mohio.children.map((child) => <MohioTreeElement mohio={child} key={child.id} />);
  return (
    <List disablePadding dense={true}>
      <ListItem button onClick={handleClick}>
        <ListItemText primary={mohio.name} />{open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding dense={true} className={classes.nested}>
          {children}
        </List>
      </Collapse>
    </List>
  )
}

const actionCreators = {
  selectMohio: setMohioView,
}

export default connect(null, actionCreators)(MohioTreeElementMultiLevel);