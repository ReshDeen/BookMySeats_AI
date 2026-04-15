// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0KigMSTkCXvQy0sUEI5nXcWHGcABTzak",
  authDomain: "bookmyseatsai.firebaseapp.com",
  projectId: "bookmyseatsai",
  storageBucket: "bookmyseatsai.firebasestorage.app",
  messagingSenderId: "1066738061230",
  appId: "1:1066738061230:web:869ea23524d278ef90823f",
  measurementId: "G-FN8CELEJ43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider()