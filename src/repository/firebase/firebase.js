import * as firebase from 'firebase';

const firebaseConfigProduction = {
  apiKey: "AIzaSyBjkOuwSH1ZR2k7bFFHH9FSVAuE-mUlWEE",
  authDomain: "mohio-app.firebaseapp.com",
  databaseURL: "https://mohio-app.firebaseio.com",
  projectId: "mohio-app",
  storageBucket: "mohio-app.appspot.com",
  messagingSenderId: "166444691109",
  appId: "1:166444691109:web:0d283c2f1dc88778"
};

const app = firebase.initializeApp(firebaseConfigProduction);

export default app;