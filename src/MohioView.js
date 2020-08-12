import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
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

function MohioView() {
  const classes = useStyles();
  return (
    <main className={classes.content}>
      <Toolbar />
      <Grid container alignItems="center" className={classes.title}>
        <Grid item xs>
          <Typography variant="h5">Mohio</Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" color="default" disableElevation className={classes.button}>Edit</Button>
          <Button variant="contained" color="default" disableElevation className={classes.button}>New</Button>
          <Button variant="contained" color="secondary" disableElevation className={classes.button}>Delete</Button>
        </Grid>
      </Grid>
      <Typography paragraph>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
        ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent elementum
        facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in hendrerit
        gravida rutrum quisque non tellus. Convallis convallis tellus id interdum velit laoreet id
        donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit
        adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra nibh cras.
        Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo quis
        imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus at augue. At augue eget
        arcu dictum varius duis at consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem
        donec massa sapien faucibus et molestie ac.
      </Typography>
    </main>
  );
}

export default MohioView;
