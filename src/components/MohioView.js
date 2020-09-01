import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
  main: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(2),
  },
  button: {
    marginRight: theme.spacing(1),
  },
  title: {
    marginBottom: theme.spacing(2),
  }
}));

function MohioView(props) {
  const classes = useStyles();
  const mohio = props.mohio;
  return (
    <main className={classes.main}>
      <Toolbar />
      <div className={classes.content}>
        <Grid container alignItems="center" className={classes.title}>
          <Grid item xs>
            <Typography variant="h5">{mohio?.name}</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" color="default" disableElevation className={classes.button}>Edit</Button>
            <Button variant="contained" color="default" disableElevation className={classes.button}>New</Button>
            <Button variant="contained" color="secondary" disableElevation className={classes.button}>Delete</Button>
          </Grid>
        </Grid>
        <Typography paragraph>{mohio?.definition}</Typography>
      </div>
    </main>
  );
}

export default MohioView;
