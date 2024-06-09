import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

function LoginPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: 'http://localhost:5173/signin',
        // This must be true.
        handleCodeInApp: true
    };

    const logIn = () => {
        sendSignInLinkToEmail(getAuth(), email, actionCodeSettings).then(() => {
            setError('');
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', email);
            navigate('/');

        }).catch((error) => {
            setError(error.message);
        });
    }

    useEffect(() => {
        // Confirm the link is a sign-in with email link.
        if (isSignInWithEmailLink(getAuth(), window.location.href)) {
        // Additional state parameters can also be passed via URL.
        // This can be used to continue the user's intended action before triggering
        // the sign-in operation.
        // Get the email if available. This should be available if the user completes
        // the flow on the same device where they started it.
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            // User opened the link on a different device. To prevent session fixation
            // attacks, ask the user to provide the associated email again. For example:
            email = window.prompt('Please provide your email for confirmation');
        }
        // The client SDK will parse the code from the link for you.
        signInWithEmailLink(getAuth(), email, window.location.href)
            .then((result) => {
            // Clear email from storage.
            window.localStorage.removeItem('emailForSignIn');
            // You can access the new user by importing getAdditionalUserInfo
            // and calling it with result:
            // getAdditionalUserInfo(result)
            // You can access the user's profile via:
            // getAdditionalUserInfo(result)?.profile
            // You can check if the user is new or existing:
            // getAdditionalUserInfo(result)?.isNewUser
            })
            .catch((error) => {
            // Some error occurred, you can inspect the code: error.code
            // Common errors could be invalid email and invalid or expired OTPs.
            });
        }
    }, [])

    return(
        <div id="login-page-container">
            <h1 className="page-h1">Sign In</h1>
            <div className="demo-details-container">
                <div id="login-directions">Enter your email to receive a sign-in link</div>
                <input 
                    name="email-input"
                    className="login-input" 
                    type="Email" 
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <button name="continue-button" className="continue-button" onClick={logIn}>Continue</button>
                {error && <p className="error-text">{error}</p>}
            </div>
        </div>
    )
}

export default LoginPage