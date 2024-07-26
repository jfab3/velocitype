import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import useUser from '../hooks/useUser';
import axios from 'axios';

function MyDocsPage() {
    const { user, isLoading } = useUser();
    const [myDocuments, setMyDocuments] = useState([]);
    const navigate = useNavigate();

    const navigateToDoc = (docId) => {
        navigate(`/document/${docId}`);
    }

    const navigateToSignIn = () => {
        navigate('/signin');
    }

    useEffect(() => {
        const getMyDocuments = async () => {
            const token = user && await user.getIdToken();
            const headers = token ? { authtoken: token } : {};

            try {
                const start = performance.now();
                const response = await axios.get('/api/user/documents', { headers });
                const end = performance.now();
                console.log(`Axios request time: ${end - start} ms`);
                const documents = response.data;
                if (!documents) {
                    return;
                }
                setMyDocuments(documents);
            } catch {
                console.log("Could not load documents");
            }
        }

        getMyDocuments();
    }, [user, isLoading]);

    return(
        <div id="my-docs-page-container">
            <h1 className="page-h1">My Documents</h1>
            {user
                    ? 
                        <div className="documents-grid">
                        {myDocuments && myDocuments.map(doc => (
                            <div 
                                dangerouslySetInnerHTML={{__html: doc.html}}
                                onClick={() => navigateToDoc(doc.docId)}>
                            </div>
                        ))}
                        </div>
                    : 
                        <div className="demo-details-container">
                            <div className="login-directions">Sign in to view your saved docs</div>
                            <button name="sign-in-button" className="sign-in-button" onClick={navigateToSignIn}>Sign In</button>
                        </div>
                }
            
        </div>
    )
}

export default MyDocsPage;
