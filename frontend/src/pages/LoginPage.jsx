import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, getAdditionalUserInfo } from "firebase/auth";
import useUser from "../hooks/useUser";
import { CgSpinner } from "react-icons/cg";

function LoginPage() {
    const LOGIN_EMAIL_NOT_SENT = "-1";
    const LOGIN_EMAIL_PENDING = "0";
    const LOGIN_EMAIL_SENT = "1"

    const [email, setEmail] = useState('');
    const [isLoginEmailSent, setIsLoginEmailSent] = useState(LOGIN_EMAIL_NOT_SENT);
    const [error, setError] = useState('');
    const { user, isLoading } = useUser();
    const navigate = useNavigate();

    const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: `${window.location.origin}/signin`,
        // This must be true.
        handleCodeInApp: true
    };

    const logIn = (e) => {
        e.preventDefault();
        setIsLoginEmailSent(LOGIN_EMAIL_PENDING);
        
        sendSignInLinkToEmail(getAuth(), email, actionCodeSettings).then(() => {
            setError('');
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', email);
            setIsLoginEmailSent(LOGIN_EMAIL_SENT);
        }).catch((error) => {
            setError(error.message);
            setIsLoginEmailSent(LOGIN_EMAIL_NOT_SENT);
        });
    }

    const navigateToHome = () => {
        navigate('/');
    }

    useEffect(() => {
        // Confirm the link is a sign-in with email link.
        if (isSignInWithEmailLink(getAuth(), window.location.href)) {
            // Additional state parameters can also be passed via URL.
            // This can be used to continue the user's intended action before triggering
            // the sign-in operation.
            // Get the email if available. This should be available if the user completes
            // the flow on the same device where they started it.
            let emailForSignIn = window.localStorage.getItem('emailForSignIn');
            if (!emailForSignIn) {
                // User opened the link on a different device. To prevent session fixation
                // attacks, ask the user to provide the associated email again. For example:
                emailForSignIn = window.prompt('Please provide your email for confirmation');
            }
            // The client SDK will parse the code from the link for you.
            signInWithEmailLink(getAuth(), emailForSignIn, window.location.href).then((result) => {
                // Clear email from storage.
                window.localStorage.removeItem('emailForSignIn');
                // You can access the new user by importing getAdditionalUserInfo
                // and calling it with result:
                // getAdditionalUserInfo(result)
                // You can access the user's profile via:
                // getAdditionalUserInfo(result)?.profile
                // You can check if the user is new or existing:
                // getAdditionalUserInfo(result)?.isNewUser
            }).catch((error) => {
                // Common errors could be invalid email and invalid or expired OTPs.
                setError(error.message);
            });
        }
    }, [])

    useEffect(() => {
        user && setEmail(user.email);
    }, [user])

    return(
        <div id="login-page-container">
            {!isLoading && <>
            <h1 className="page-h1">Sign In</h1>
            <section className="demo-details-container">
                {user &&
                    <>
                        <p className="success-text">{`Successfully signed in as ${email}`}</p>
                        <button name="home-button" className="home-button" onClick={navigateToHome}>Home</button>
                    </>
                }
                {!user && (isLoginEmailSent !== LOGIN_EMAIL_SENT) &&
                    <>
                        <span className="directions-and-spinner">
                            <p className="directions-text">Enter your email to receive a sign-in link</p>
                            {isLoginEmailSent === LOGIN_EMAIL_PENDING &&
                                <CgSpinner className="icon-spinner"/>
                            }
                        </span>
                        <form onSubmit={logIn}>
                            <input 
                                name="email-input"
                                className="login-input"
                                type="Email" 
                                placeholder="Email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            <button name="continue-button" className="continue-button" type="submit">Continue</button>
                        </form>
                    </>
                }
                {!user && (isLoginEmailSent === LOGIN_EMAIL_SENT) &&
                    <>
                        <p className="directions-text">{`Sign-in link has been sent to ${email}`}</p>
                        <button name="home-button" className="home-button" onClick={navigateToHome}>Home</button>
                    </>
                }
                {error && <p className="error-text">{error}</p>}
            </section>
            </>}
        </div>
    )
}

export default LoginPage