import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    boxShadow: theme.shadows[2],
  },
  toolBar: {
    paddingLeft: theme.spacing(2),
  }
}));

function MohioAppBar(props) {
  const classes = useStyles();
  return (
    <header>
      <AppBar position="fixed" className={classes.appBar} color="inherit">
        <Toolbar className={classes.toolBar}>
          <Typography variant="h5" noWrap>
            Mohio
        </Typography>
        </Toolbar>
      </AppBar>
    </header>
  );
}

export default MohioAppBar;