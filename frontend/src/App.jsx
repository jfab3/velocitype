import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import FooterBar from './components/FooterBar';
import HomePage from './pages/HomePageRedirect';
import DocumentPage from './pages/DocumentPage';
import DevelopmentDetailsPage from './pages/DevelopmentDetailsPage';
import AboutPage from './pages/AboutPage';
import MyDocsPage from './pages/MyDocsPage';
import LoginPage from './pages/LoginPage';


function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div className="page-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/document/:docId" element={<DocumentPage />} />
        <Route path="/my-docs" element={<MyDocsPage />} />
        <Route path="/development" element={<DevelopmentDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/signin" element={<LoginPage />} />
      </Routes>
      </div>
      <FooterBar />
    </BrowserRouter>
  )
}

export default App
