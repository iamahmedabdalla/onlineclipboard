// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCZGGnNknpE4Q_BtzP61_KGjYV_VkV6KtQ",
    authDomain: "mine-clipboard.firebaseapp.com",
    projectId: "mine-clipboard",
    storageBucket: "mine-clipboard.appspot.com",
    messagingSenderId: "287675820162",
    appId: "1:287675820162:web:58aa03da9d08892ac9ec9b",
    measurementId: "G-QJ82NG68WT"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
export { auth, db };