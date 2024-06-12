import { useCallback, useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import useUser from '../hooks/useUser';
import TextEditor from '../components/TextEditor';

function HomePage() {
    const { user, isLoading } = useUser();
    const [textAlignment, setTextAlignment] = useState("center");
    const textEditor = useRef()
    const { docId } = useParams();

    const wrapperRef = useCallback(async (wrapper) => {
        if (wrapper == null) { return; }
        wrapper.innerHTML = "";
        textEditor.current = new TextEditor(wrapper, docId, user, isLoading);
        await textEditor.current.loadHtmlFromServer();
    }, []);

    useEffect(() => {
        textEditor.current.setTextAlignment(textAlignment);
    }, [textAlignment]);

    useEffect(() => {
        const loadHtmlForUser = async () => {
            textEditor.current.setUser(user);
            textEditor.current.setIsLoading(isLoading);
            await textEditor.current.loadHtmlFromServer();
        }
        loadHtmlForUser();
    }, [user, isLoading]);

    return (
        <>
        <div id="home-page-container">
            <div id="basic-directions-container">
                <div>Velocitype styles your text based on the speed at which you type.</div>
            </div>
            <div id="content-editable-container" ref={wrapperRef}></div>
            <div id="alignment-button-container">
                <button id="align-left" className="alignment-button" onClick={() => setTextAlignment("left")}>Align Left</button>
                <button id="align-center" className="alignment-button" onClick={() => setTextAlignment("center")}>Align Center</button>
                <button id="align-right" className="alignment-button" onClick={() => setTextAlignment("right")}>Align Right</button>
            </div>
        </div>
        </>
    )
}

export default HomePage
