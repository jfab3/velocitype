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
            // An error occurred.
        });
    }

    return (
        <header id="navbar">
            <h1 ref={titleTextRef} className="title">
                <Link to="/" className="navbar-link">
                    <span className="titleLetter" style={{fontSize: "18px"}}>V</span>
                    <span className="titleLetter" style={{fontSize: "22px"}}>E</span>
                    <span className="titleLetter" style={{fontSize: "26px"}}>L</span>
                    <span className="titleLetter" style={{fontSize: "32px"}}>O</span>
                    <span className="titleLetter" style={{fontSize: "34px"}}>C</span>
                    <span className="titleLetter" style={{fontSize: "32px"}}>I</span>
                    <span className="titleLetter" style={{fontSize: "29px"}}>T</span>
                    <span className="titleLetter" style={{fontSize: "26px"}}>Y</span>
                    <span className="titleLetter" style={{fontSize: "22px"}}>P</span>
                    <span className="titleLetter" style={{fontSize: "18px"}}>E</span>
                </Link>
            </h1>
            
            <nav className="page-links-container">
                <Link to="/" className="navbar-link">Home</Link>
                <Link to="/my-docs" className="navbar-link">Docs</Link>
                <Link to="/development" className="navbar-link">Development</Link>
                <Link to="/about" className="navbar-link">About</Link>
            </nav >

                {user 
                    ? !isLoading && <button className="navbar-button" onClick={logOut}>Sign Out</button>
                    : !isLoading && <button className="navbar-button" onClick={navigateToLogIn}>Sign In</button>}

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
