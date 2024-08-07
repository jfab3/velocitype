import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/App.css'
import './styles/index.css'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// NOTE: These are public keys and do not need to be stored securely
const firebaseConfig = {
  apiKey: "AIzaSyAD8tt7k1dWrfl5Yi-UOfExpbnqF9EoT30",
  authDomain: "velocitype-app.firebaseapp.com",
  projectId: "velocitype-app",
  storageBucket: "velocitype-app.appspot.com",
  messagingSenderId: "183612168436",
  appId: "1:183612168436:web:95b690be339cd21c14e6a1",
  measurementId: "G-NP405BENDR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
