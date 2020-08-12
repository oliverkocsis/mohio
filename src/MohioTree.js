import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import MohioTreeElement from './MohioTreeElement';

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
}));

function MohioTree(props) {
  const classes = useStyles();
  const mohios = props.mohios.map((mohio) => <MohioTreeElement name={mohio.name} children={mohio.children} />);
  return (
    <Drawer className={classes.drawer} variant="permanent" classes={{ paper: classes.drawerPaper, }}>
      <Toolbar />
      <div className={classes.drawerContainer}>
        <List component="nav" dense={true}>
          {mohios}
        </List>
      </div>
    </Drawer>
  );
}

export default MohioTree;
