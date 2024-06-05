import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/development" element={<DevelopmentDetailsPage />} />
      </Routes>
      <FooterBar />
    </BrowserRouter>
  )
}

export default App
