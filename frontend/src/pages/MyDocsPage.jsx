import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import useUser from '../hooks/useUser';
import IconButton from '../components/IconButton';
import { MdDeleteOutline } from "react-icons/md";
import axios from 'axios';
import sanitizeHtml from 'sanitize-html';

function MyDocsPage() {
    const { user, isLoading } = useUser();
    const [myDocuments, setMyDocuments] = useState([]);
    const [cursorId, setCursorId] = useState(0);
    const [cursorHasNext, setCursorHasNext] = useState(false);
    const lastDocObserver = useRef();
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
            await axios.delete(`/api/documents/${doc.docId}`, { headers });
            setMyDocuments((curDocuments) => curDocuments.filter((curDoc) => curDoc.docId !== doc.docId));
        } catch (e) {
            console.log("Could not delete document");
        }
    }

    const loadInitialDocuments = async () => {
        if (isLoading) {
            return;
        }

        const token = user && await user.getIdToken();
        const headers = token ? { authtoken: token } : {};

        try {
            const response = await axios.get('/api/documents', { headers, params: { limit: 16 } });
            setMyDocuments(response.data.documents);
            setCursorId(response.data.cursorId);
            setCursorHasNext(response.data.cursorHasNext);
        } catch {
            console.log("Could not load documents");
        }
    }

    const loadMoreDocuments = async () => {
        if (isLoading || !cursorHasNext) {
            return;
        }

        const token = user && await user.getIdToken();
        const headers = token ? { authtoken: token } : {};

        try {
            const response = await axios.get('/api/documents', { headers, params: { limit: 8, cursorId } });
            const documents = response.data.documents;
            setMyDocuments(curDocuments => curDocuments.concat(documents));
            setCursorId(response.data.cursorId);
            setCursorHasNext(response.data.cursorHasNext);
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
        setIsDocGridEmpty(!isLoading && (!myDocuments || myDocuments.length === 0));
    }, [myDocuments]);

    useEffect(() => {
        loadInitialDocuments();
    }, [user, isLoading]);

    const lastDocRef = useCallback((node) => {
        if (!user || isLoading) {
            return;
        }

        if (lastDocObserver.current) {
            lastDocObserver.current.disconnect();
        }

        lastDocObserver.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && cursorHasNext) {
                loadMoreDocuments();
            }
        });
        
        if (node) {
            lastDocObserver.current.observe(node);
        }
    }, [cursorId]);

    return (
        <div id="my-docs-page-container">
            <h1 className="page-h1">My Documents</h1>
            {user && !isDocGridEmpty &&
                <div className="documents-grid">
                {myDocuments && myDocuments.map((doc, idx) => (
                    <div className="document-preview" key={doc.docId} ref={idx === myDocuments.length - 1 ? lastDocRef : null}>
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
