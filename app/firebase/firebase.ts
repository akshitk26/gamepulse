import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCO2GoxRjwaMUBABQToE16hEJRN1Xpgx-M',
  authDomain: 'gamepulsecom.firebaseapp.com',
  projectId: 'gamepulsecom',
  storageBucket: 'gamepulsecom.firebasestorage.app',
  messagingSenderId: '350028068685',
  appId: '1:350028068685:web:008618cb9445ce6d332904',
  measurementId: 'G-SE6PBHC26P',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
