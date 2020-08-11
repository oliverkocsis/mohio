import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

const drawerWidth = '20rem';

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContainer: {
    overflow: 'auto',
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
}));

function MohioTree(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const handleClick = () => {
    setOpen(!open);
  };
  return (
    <Drawer className={classes.drawer} variant="permanent" classes={{ paper: classes.drawerPaper, }}>
      <Toolbar />
      <div className={classes.drawerContainer}>
        <List component="nav" dense="true">
          <ListItem button>
            <ListItemText primary="About" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Domain" />
          </ListItem>
          <List disablePadding dense="true">
            <ListItem button onClick={handleClick}>
              <ListItemText primary="Process" />{open ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List disablePadding dense="true">
                <ListItem button className={classes.nested}>
                  <ListItemText primary="Create a Mohio" />
                </ListItem>
              </List>
            </Collapse>
          </List>
        </List>
      </div>
    </Drawer>
  );
}

export default MohioTree;
