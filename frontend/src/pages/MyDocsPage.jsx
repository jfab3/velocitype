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
    const [isDocGridEmpty, setIsDocGridEmpty] = useState(false);
    const navigate = useNavigate();

    const navigateToDoc = (docId) => {
        navigate(`/document/${docId}`);
    }

    const navigateToSignIn = () => {
        navigate('/signin');
    }

    const navigateToHome = () => {
        navigate('/');
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
        if (isLoading) {
            return;
        }

        const token = user && await user.getIdToken();
        const headers = token ? { authtoken: token } : {};

        try {
            const response = await axios.get('/api/user/documents', { headers });
            const documents = response.data;
            setIsDocGridEmpty(documents.length == 0);
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
            {user && !isDocGridEmpty &&
                <div className="documents-grid">
                {myDocuments && myDocuments.map(doc => (
                    <div className="document-preview" key={doc.docId}>
                        <div className="document-preview-toolbar">
                            <IconButton onClick={() => deleteDocument(doc)} Icon={MdDeleteOutline} />
                        </div>
                        <button className="document-preview-content"
                            dangerouslySetInnerHTML={{__html: getSanitizedHtml(doc.html)}}
                            onClick={() => navigateToDoc(doc.docId)}>
                        </button>
                    </div>
                ))}
                </div>
            }
            {user && isDocGridEmpty &&
                <div className="demo-details-container">
                    <div className="directions-text">Create your first document</div>
                    <button name="home-button" className="home-button" onClick={navigateToHome}>Home</button>
                </div>
            }
            {!user && !isLoading &&
                <div className="demo-details-container">
                    <div className="directions-text">Sign in to view your saved docs</div>
                    <button name="sign-in-button" className="sign-in-button" onClick={navigateToSignIn}>Sign In</button>
                </div>
            }
        </div>
    )
}

export default MyDocsPage;
