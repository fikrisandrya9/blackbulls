import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgNp4aFtIVPcAn250bW571etKpVnr0EPg",
  authDomain: "fikri111.firebaseapp.com",
  projectId: "fikri111",
  storageBucket: "fikri111.firebasestorage.app",
  messagingSenderId: "228073698402",
  appId: "1:228073698402:web:c469de4a445d8b36938d3b",
  measurementId: "G-KHSMF201NH",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
