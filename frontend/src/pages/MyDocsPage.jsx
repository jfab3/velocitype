import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import useUser from '../hooks/useUser';
import IconButton from '../components/IconButton';
import { MdDeleteOutline } from "react-icons/md";
import axios from 'axios';
import sanitizeHtml from 'sanitize-html';

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

    const deleteDocument = async (doc) => {
        const token = user && await user.getIdToken();
        const headers = token ? { authtoken: token } : {};

        try {
            await axios.delete(`/api/documents/${doc.docId}/delete`, { headers });
            getMyDocuments();
        } catch (e) {
            console.log("Could not delete document");
        }
    }

    const getMyDocuments = async () => {
        const token = user && await user.getIdToken();
        const headers = token ? { authtoken: token } : {};

        try {
            const response = await axios.get('/api/user/documents', { headers });
            const documents = response.data;
            if (!documents) {
                return;
            }
            setMyDocuments(documents);
        } catch {
            console.log("Could not load documents");
        }
    }

    const getSanitizedHtml = (dirtyHtml) => {
        const allowedHtml = { 
            allowedTags: ['div', 'span', 'br'],
            allowedAttributes: { 'span': ["style", "class"] },
            allowedStyles: { 'p': { 'font-size': [/^\d+rem$/] } }
        }

        const cleanHtml = sanitizeHtml(dirtyHtml, allowedHtml);
        return cleanHtml;
    }

    useEffect(() => {
        getMyDocuments();
    }, [user, isLoading]);

    return (
        <div id="my-docs-page-container" className='page-container'>
            <h1 className="page-h1">My Documents</h1>
            {user 
                ? 
                    <div className="documents-grid">
                    {myDocuments && myDocuments.map(doc => (
                        <div className="document-preview">
                            <div className="document-preview-toolbar">
                                <IconButton onClick={() => deleteDocument(doc)} Icon={MdDeleteOutline} />
                            </div>
                            <div className="document-preview-content"
                                dangerouslySetInnerHTML={{__html: getSanitizedHtml(doc.html)}}
                                onClick={() => navigateToDoc(doc.docId)}>
                            </div>
                        </div>
                    ))}
                    </div>
                : 
                    !isLoading && <div className="demo-details-container">
                        <div className="login-directions">Sign in to view your saved docs</div>
                        <button name="sign-in-button" className="sign-in-button" onClick={navigateToSignIn}>Sign In</button>
                    </div>
            }
            
        </div>
    )
}

export default MyDocsPage;
