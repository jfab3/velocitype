import { useCallback } from 'react'
import Quill from 'quill'
import FontSizeBlot from './fontSizeBlot'

export default function TextEditor () {
     const wrapperRef = useCallback((wrapper) => {
        if (wrapper == null) { return }

        wrapper.innerHTML = "";
        const editor = document.createElement('div');
        wrapper.append(editor);
        const quill = new Quill(editor);

        const Delta = Quill.import('delta');
        quill.setContents(
            new Delta().insert('Sample text to format!', { bold: false }).insert('\n')
        );

        Quill.register(FontSizeBlot);
        quill.formatText(3, 4, 'fontSizeBlot', '30px')
    }, []);

    return (
        <div id="container" ref={wrapperRef}>
        </div>
    )
}
