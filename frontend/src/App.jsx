import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidV4 } from "uuid";
import NavBar from './components/NavBar';
import FooterBar from './components/FooterBar';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DevelopmentDetailsPage from './pages/DevelopmentDetailsPage';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to={`/documents/${uuidV4()}`} />} />
        <Route path="/documents/:id" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/development" element={<DevelopmentDetailsPage />} />
      </Routes>
      <FooterBar />
    </BrowserRouter>
  )
}

export default App
