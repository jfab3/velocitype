import { useCallback, useState, useRef, useEffect } from 'react'
import TextEditor from './TextEditor'

function App() {
  const [textAlignment, setTextAlignment] = useState(0)
  const textEditor = useRef()

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) { return; }
    wrapper.innerHTML = "";
    textEditor.current = new TextEditor(wrapper);
  }, []);

  useEffect(() => {
    textEditor.current.setTextAlignment(textAlignment);
  }, [textAlignment]);

  return (
    <>
      <div id="container" ref={wrapperRef}></div>
      <div id="alignment-button-container">
        <button id="align-left" className="alignment-button" onClick={() => setTextAlignment("left")}>Align Left</button>
        <button id="align-center" className="alignment-button" onClick={() => setTextAlignment("center")}>Align Center</button>
        <button id="align-right" className="alignment-button" onClick={() => setTextAlignment("right")}>Align Right</button>
      </div>
    </>
  )
}

export default App
