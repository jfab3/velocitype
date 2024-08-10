import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import useUser from "../hooks/useUser";
import DropdownMenu from "./DropdownMenu";

const NavBar = () => {
    const { user, isLoading } = useUser();
    const titleTextRef = useRef();
    const navigate = useNavigate();

    const navigateToLogIn = () => {
        navigate('/signin');
    }

    const logOut = () => {
        signOut(getAuth()).then(() => {
            // Sign-out successful.
            navigate('/');
        }).catch((error) => {
            // An error happened.
        });
    }

    return (
        <header id="navbar">
            <span ref={titleTextRef} className="title">
                <Link to="/" className="navbar-link">
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
                <Link to="/" className="navbar-link">Home</Link>
                <Link to="/my-docs" className="navbar-link">Docs</Link>
                <Link to="/development" className="navbar-link">Development</Link>
                <Link to="/about" className="navbar-link">About</Link>
            </nav >

            <span className="sign-in-link-container">
                {user 
                    ? !isLoading && <button className="navbar-button" onClick={logOut}>Sign Out</button>
                    : !isLoading && <button className="navbar-button" onClick={navigateToLogIn}>Sign In</button>}
            </span>

            <DropdownMenu>
                <Link to="/" id="home-dropdown-item" className="navbar-link">Home</Link>
                <Link to="/my-docs" id="docs-dropdown-item" className="navbar-link">Docs</Link>
                <Link to="/development" id="dev-dropdown-item" className="navbar-link">Development</Link>
                <Link to="/about" id="about-dropdown-item" className="navbar-link">About</Link>
                {user 
                    ? !isLoading && <button id="sign-out-dropdown-item" className="navbar-link" onClick={logOut}>Sign Out</button>
                    : !isLoading && <button id="sign-in-dropdown-item" className="navbar-link" onClick={navigateToLogIn}>Sign In</button>}
            </DropdownMenu>
        </header>
    )
}

export default NavBar;
