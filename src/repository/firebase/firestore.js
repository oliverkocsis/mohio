import app from './firebase';
import 'firebase/firestore';

const firestore = app.firestore();

if (process.env.NODE_ENV === 'test') {
  firestore.settings({
    host: "localhost:8080",
    ssl: false
  });
}

export default firestore;