import { useRef } from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
    const titleTextRef = useRef();

    function setTitleTextStyle () {
        const titleStyles = ['title-style-1', 'title-style-2', 'title-style-3', 'title-style-4', 'title-style-5'];
        for (const style of titleStyles) {
            titleTextRef.current.classList.remove(style);
        }
        const randStyle1 = titleStyles[Math.floor(Math.random() * titleStyles.length)];
        const randStyle2 = titleStyles[Math.floor(Math.random() * titleStyles.length)];
        titleTextRef.current.classList.add(randStyle1);
        titleTextRef.current.classList.add(randStyle2);
    }

    return (
        <header id="navbar">
            <span ref={titleTextRef} className="title title-style-1" onClick={setTitleTextStyle}>
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
