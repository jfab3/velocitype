import axios from 'axios';
import sanitizeHtml from 'sanitize-html';

class TextEditor {

    constructor (div, docId, user, isLoading) {        
        this._docId = docId;
        this._user = user;
        this._isLoading = isLoading;

        this._contentEditableDiv = document.createElement('div');
        this._contentEditableDiv.contentEditable = true;
        this._contentEditableDiv.spellcheck = false;
        this._contentEditableDiv.className = "content-editable-div";

        this._allowedHtml = { 
            allowedTags: ['div', 'span', 'br'],
            allowedAttributes: { 'span': ["style", "class"] },
            allowedStyles: { 'p': { 'font-size': [/^\d+rem$/] } }
        }
        
        this._contentEditableDiv.onbeforeinput = this.handleBeforeInput.bind(this);
        this._contentEditableDiv.onblur = this.handleOnBlur.bind(this);
        // this._contentEditableDiv.onpaste = this.catchPaste.bind(this);
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => this.enforceHierarchy(node));
                }
            })
        });
        observer.observe(this._contentEditableDiv, { childList: true, subtree: true });
    
        this._timerId;
        this._timeElapsed = 1;
        this._numTextChanges = 0;
        this._keyPressTimeStamps = [0];
        this._isTimerRunning = false;

        this._range = document.createRange();
        this._selection = window.getSelection();

        div.appendChild(this._contentEditableDiv);
        this._contentEditableDiv.focus();
    }

    setUser (user) {
        this._user = user;
    }

    setIsLoading (isLoading) {
        this._isLoading = isLoading;
    }

    async loadHtmlFromServer () {
        const token = this._user && await this._user.getIdToken();
        const headers = token ? { authtoken: token } : {};
        try {
            const response = !this._isLoading && await axios.get(`/api/documents/${this._docId}`, { headers });
            const docInfo = response && response.data;
            if (!docInfo) {
                return;
            }
            const dirtyHtml = docInfo.html;
            const cleanHtml = sanitizeHtml(dirtyHtml, this._allowedHtml);
            this._contentEditableDiv.innerHTML = cleanHtml;
        } catch (error) {
            if (!this._isLoading && error.response.status === 403) {
                this._contentEditableDiv.contentEditable = false;
                this._contentEditableDiv.innerHTML = "You do not have the permissions to open this document.";
            }
        }
    }

    async saveHtmlToServer () {
        const token = this._user && await this._user.getIdToken();
        const headers = token ? { authtoken: token } : {};
        const dirtyHtml = this._contentEditableDiv.innerHTML;
        const cleanHtml = sanitizeHtml(dirtyHtml, this._allowedHtml);
        await axios.put(`/api/documents/${this._docId}/save`, {
            docId: this._docId,
            html: cleanHtml
        }, { 
            headers
        });
    }

    setTextAlignment (alignment) {
        this._contentEditableDiv.style.textAlign = alignment;
    }

    handleOnBlur () {
        this.saveHtmlToServer();
        this.stopTimer();
    }

    catchPaste (e) {
        let clipboardData, pastedData;

        // Stop data from being pasted
        e.stopPropagation();
        e.preventDefault();

        // Get pasted data from clipboard API
        clipboardData = e.clipboardData || window.clipboardData;
        pastedData = clipboardData.getData('Text');
    }

    handleBeforeInput (e) {
        if (e.inputType === "insertFromPaste") {
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        this._numTextChanges += 1;
        const speed = this._calculateSpeed();
        const fontSize = `${speed * 0.75 + 0.5}em`;
        const eventKey = e.data;
        // not a good way to check, just for the time being...
        if (eventKey !== null) {
            e.stopPropagation();
            e.preventDefault();
            
            const span = document.createElement("span");
            span.innerText = eventKey;
            span.style.fontSize = fontSize;
            span.classList.add("text-span");

            this._setNewText(span);
            if (!this._isTimerRunning) {
                this.startTimer();
            }
        } else if (e.inputType === "insertParagraph") {
            return

            e.stopPropagation();
            e.preventDefault();
            
            const newline = document.createElement("div");
            newline.innerHTML = " ";
            newline.style.fontSize = fontSize;
            newline.classList.add("text-span");
            
            this._setNewText(newline);
            if (!this._isTimerRunning) {
                this.startTimer();
            }
        } 
    }

    enforceHierarchy (addedNode) {
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
            if (addedNode === this._contentEditableDiv) { // content-editable level
                // do nothing
            } else if (addedNode.parentNode === this._contentEditableDiv) { // section div level
                if (addedNode.nodeName !== 'DIV') {
                    // On "delete all", a BR is sometimes added at this level. In that case, addedNode should be deleted.
                    addedNode.remove();
                }
            } else if (addedNode.parentNode?.parentNode === this._contentEditableDiv) { // text-span level
                // do nothing
                /*
                console.log("Text Span Added");
                if (addedNode.nodeName !== 'SPAN') {
                    // On "delete all", a BR is sometimes added at this level. In that case, the SECTION DIV containing addedNode should be deleted.
                    addedNode.parentNode.remove();
                }
                */
            } else if (addedNode.parentNode?.parentNode?.parentNode === this._contentEditableDiv) { // text-node level
                // do nothing
            }
        }
    }

    _setNewText (dirtyNewTextElem) {
        /**
         * DOM Structure:
         *      > content-editable
         *          > section-divs
         *              > text-spans
         *                  > IF EMPTY: br
         *                  > IF NOT EMPTY: text-node
         */

        const cleanHtml = sanitizeHtml(dirtyNewTextElem.outerHTML, this._allowedHtml);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanHtml;
        let newTextElem;
        if (tempDiv.firstChild) {
            newTextElem = tempDiv.firstChild.cloneNode(true);
        } else {
            return;
        }

        const anchorNode = document.getSelection().anchorNode;
        const anchorNodeOffset = document.getSelection().anchorOffset;

        const focusNode = document.getSelection().focusNode;
        const focusNodeOffset = document.getSelection().focusOffset;
        
        if (anchorNode === this._contentEditableDiv) { // content-editable selected
            console.log("Content Editable Selected");
            const childrenNodes = this._contentEditableDiv.children;

            if (childrenNodes.length === 0) {
                const newSection = document.createElement("div");
                newSection.appendChild(newTextElem);
                this._contentEditableDiv.appendChild(newSection);
                this._range.setStartAfter(newSection.children[0], 0);
                this._range.collapse(true);

                this._selection.removeAllRanges();
                this._selection.addRange(this._range);
                return;
            }

            // I think the only way to get here is to reload a document that already has some content then start typing...
            // Could be wrong though...
            this._range.setStart(anchorNode.children[0], 0);
            
            this._range.collapse(true);
            this._range.insertNode(newTextElem);
            this._range.collapse();

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        } else if (anchorNode.parentNode === this._contentEditableDiv) { // section div selected
            console.log("Section Div Selected");
            
            if (this._range.commonAncestorContainer === document) {
                this._range.setStart(anchorNode, anchorNodeOffset);
                this._range.setEnd(focusNode, focusNodeOffset);
            }
            this._range.collapse(true);
            this._range.insertNode(newTextElem);
            this._range.collapse();

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        } else if (anchorNode.parentNode.parentNode === this._contentEditableDiv) { // text-span selected
            console.log("Text Span Selected");

            // Replace text-span containing br in new section
            if (anchorNode.children?.[0]?.nodeName === 'BR') {
                this._range.setStartBefore(anchorNode);
                this._range.setEndAfter(anchorNode);
                this._range.deleteContents();
                this._range.insertNode(newTextElem);
                this._range.setStartAfter(newTextElem);
                this._range.collapse(true);

                this._selection.removeAllRanges();
                this._selection.addRange(this._range);
                return;
            }

            const sectionDivNodes = this._contentEditableDiv.children;

            const selectedSectionIdx = [...this._contentEditableDiv.children].indexOf(anchorNode.parentNode);
            const selectedSection = sectionDivNodes[selectedSectionIdx];
            const textSpanNodesInSection = selectedSection.children;
            const textSpanNodeIdx = [...selectedSection.children].indexOf(anchorNode);
            
            this._range.setStartAfter(textSpanNodesInSection[textSpanNodeIdx], 0);
            this._range.collapse(true);
            this._range.insertNode(newTextElem);
            this._range.setStartAfter(textSpanNodesInSection[textSpanNodeIdx + 1], 0);
            this._range.collapse(true);

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        } else if (anchorNode.parentNode.parentNode.parentNode === this._contentEditableDiv) { // text selected
            console.log("Text Selected");

            const sectionDivNodes = this._contentEditableDiv.children;
            
            // Need to check if anchorNode or focusNode comes first in the editor...
            const anchorNodeSectionIdx = [...this._contentEditableDiv.children].indexOf(anchorNode.parentNode.parentNode);
            const anchorNodeSection = sectionDivNodes[anchorNodeSectionIdx];
            const anchorNodeTextSpanIdx = [...anchorNodeSection.children].indexOf(anchorNode.parentNode);

            const focusNodeSectionIdx = [...this._contentEditableDiv.children].indexOf(focusNode.parentNode.parentNode);
            const focusNodeSection = sectionDivNodes[focusNodeSectionIdx];
            const focusNodeTextSpanIdx = [...focusNodeSection.children].indexOf(focusNode.parentNode);
            
            this._range.setStart(anchorNodeSection, anchorNodeTextSpanIdx + anchorNodeOffset);
            this._range.insertNode(newTextElem);
            const anchorNodeShiftAfterInsert = 1;
            const focusNodeShiftAfterInsert = (anchorNodeSectionIdx === focusNodeSectionIdx) ? 1 : 0; 

            this._range.setStart(anchorNodeSection, anchorNodeTextSpanIdx + anchorNodeOffset + anchorNodeShiftAfterInsert);
            this._range.setEnd(focusNodeSection, focusNodeTextSpanIdx + focusNodeOffset + focusNodeShiftAfterInsert);
            this._range.deleteContents();
            this._range.setStart(anchorNodeSection, anchorNodeTextSpanIdx + anchorNodeOffset + 1);
            this._range.collapse(true);

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        }
    }

    _calculateSpeed () {
        const numRecentTimeStamps = 20;
        let lenTimeStampHistory = this._keyPressTimeStamps.unshift(this._timeElapsed);
        if (lenTimeStampHistory > numRecentTimeStamps) {
            this._keyPressTimeStamps.pop();
            lenTimeStampHistory -= 1;
        }
        const currentSpeed = lenTimeStampHistory / (this._keyPressTimeStamps[0] - this._keyPressTimeStamps[lenTimeStampHistory - 1]);
        const avgSpeed = this._numTextChanges / this._timeElapsed;
        return (currentSpeed * 0.8) + (avgSpeed * 0.2);
    }

    startTimer () {
        this._isTimerRunning = true;
        this._timerId = setInterval(() => {
            this._timeElapsed += .01;
            //console.log("Time Elapsed: " + this._timeElapsed);
        }, 10);
    }

    stopTimer () {
        this._isTimerRunning = false;
        this._timerId = clearInterval(this._timerId);
    }
}

export default TextEditor;
