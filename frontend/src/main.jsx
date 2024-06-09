import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/App.css'
import './styles/index.css'
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3GA_V3g1ZJ8LWSKQ7yqr3Qws84vOFwbI",
  authDomain: "velocitype-d9ef9.firebaseapp.com",
  projectId: "velocitype-d9ef9",
  storageBucket: "velocitype-d9ef9.appspot.com",
  messagingSenderId: "896494330280",
  appId: "1:896494330280:web:7193f65ac8415c9052bd9d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
