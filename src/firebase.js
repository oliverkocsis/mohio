import * as firebase from 'firebase';

const firebaseConfig = {
  apiKey: "AIzaSyBjkOuwSH1ZR2k7bFFHH9FSVAuE-mUlWEE",
  authDomain: "mohio-app.firebaseapp.com",
  databaseURL: "https://mohio-app.firebaseio.com",
  projectId: "mohio-app",
  storageBucket: "mohio-app.appspot.com",
  messagingSenderId: "166444691109",
  appId: "1:166444691109:web:0d283c2f1dc88778"
};


let _initialized = false;
function initialize() {
  if (!_initialized) {
    firebase.initializeApp(firebaseConfig);
    _initialized = true;
  }
}

let _firestore;
export function firestore() {
  if (!_firestore) {
    initialize();
    _firestore = firebase.firestore();
  }
  return _firestore;
} 