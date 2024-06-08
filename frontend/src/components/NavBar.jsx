import { useRef } from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
    const titleTextRef = useRef();

    return (
        <header id="navbar">
            <span ref={titleTextRef} className="title">
                <Link to="/">
                    <span className="titleLetter">V</span>
                    <span className="titleLetter">E</span>
                    <span className="titleLetter">L</span>
                    <span className="titleLetter">O</span>
                    <span className="titleLetter">C</span>
                    <span className="titleLetter">I</span>
                    <span className="titleLetter">T</span>
                    <span className="titleLetter">Y</span>
                    <span className="titleLetter">P</span>
                    <span className="titleLetter">E</span>
                </Link>
            </span>
            
            <nav className="page-links-container">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/development">Development</Link>
            </nav >
        </header>
    )
}

export default NavBar;
