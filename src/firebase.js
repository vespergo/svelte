import firebase from "firebase/app";

import "firebase/firestore";
var firebaseConfig = {
  apiKey: "AIzaSyA9oZlRyAnrZA2kbuPGeuZxBWbwiIgyCaI",
  authDomain: "test-60a84.firebaseapp.com",
  databaseURL: "https://test-60a84.firebaseio.com",
  projectId: "test-60a84",
  storageBucket: "test-60a84.appspot.com",
  messagingSenderId: "601687598853",
  appId: "1:601687598853:web:3abbea9e0795fc4107b96c",
};

firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
