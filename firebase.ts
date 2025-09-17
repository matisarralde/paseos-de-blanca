import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWEHV2A6-9ZvhFXk514O28uHd8ORR4T1Q",
  authDomain: "paseos-blanca.firebaseapp.com",
  projectId: "paseos-blanca",
  storageBucket: "paseos-blanca.firebasestorage.app",
  messagingSenderId: "471805542912",
  appId: "1:471805542912:web:89406e16e75281ffd74ee5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Get a reference to the callGemini function
export const callGemini = httpsCallable(functions, 'callGemini');
