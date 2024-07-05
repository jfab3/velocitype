import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidV4 } from "uuid";
import NavBar from './components/NavBar';
import FooterBar from './components/FooterBar';
import HomePage from './pages/HomePage';
import DevelopmentDetailsPage from './pages/DevelopmentDetailsPage';
import AboutPage from './pages/AboutPage';
import MyDocsPage from './pages/MyDocsPage';
import LoginPage from './pages/LoginPage';


function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to={`/document/${uuidV4()}`} />} />
        <Route path="/document/:docId" element={<HomePage />} />
        <Route path="/my-docs" element={<MyDocsPage />} />
        <Route path="/development" element={<DevelopmentDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/signin" element={<LoginPage />} />
      </Routes>
      <FooterBar />
    </BrowserRouter>
  )
}

export default App
