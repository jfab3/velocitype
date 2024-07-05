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
            <div className="documents-grid">
                {myDocuments && myDocuments.map(doc => (
                    <div 
                        className="demo-details-container" 
                        dangerouslySetInnerHTML={{__html: doc.html}}
                        onClick={() => navigateToDoc(doc.docId)}>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyDocsPage;
