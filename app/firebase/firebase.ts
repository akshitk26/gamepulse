import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";        // if you plan to use auth
import { getFirestore } from "firebase/firestore"; // if you plan to use Firestore
import { initializeAuth} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCO2GoxRjwaMUBABQToE16hEJRN1Xpgx-M",
  authDomain: "gamepulsecom.firebaseapp.com",
  projectId: "gamepulsecom",
  storageBucket: "gamepulsecom.firebasestorage.app",
  messagingSenderId: "350028068685",
  appId: "1:350028068685:web:008618cb9445ce6d332904",
  measurementId: "G-SE6PBHC26P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = initializeAuth(app);
export const db = getFirestore(app);
export default app;