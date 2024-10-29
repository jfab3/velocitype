import axios from 'axios';
import sanitizeHtml from 'sanitize-html';

class TextEditor {
    CONTENT_EDITABLE_LEVEL = "CONTENT_EDITABLE";
    SECTION_DIV_LEVEL = "SECTION_DIV";
    CHAR_CONTAINER_LEVEL = "CHAR_CONTAINER";
    TEXT_NODE_LEVEL = "TEXT_NODE";

    constructor (div, docId, user, isLoading) {        
        this._docId = docId;
        this._user = user;
        this._isLoading = isLoading;

        this._contentEditableDiv = document.createElement('div');
        this._contentEditableDiv.contentEditable = true;
        this._contentEditableDiv.spellcheck = false;
        this._contentEditableDiv.className = "content-editable-div";
        // Set non-standard attributes using setAttribute
        this._contentEditableDiv.setAttribute('autocorrect', 'off');
        this._contentEditableDiv.setAttribute('autocomplete', 'off');
        this._contentEditableDiv.setAttribute('autocapitalize', 'off');

        this._allowedHtml = { 
            allowedTags: ['div', 'span', 'br'],
            allowedAttributes: { 'span': ["style", "class"] },
            allowedStyles: { 'p': { 'font-size': [/^\d+rem$/] } }
        }
        
        this._contentEditableDiv.onbeforeinput = this.handleBeforeInput.bind(this);
        this._contentEditableDiv.onblur = this.handleOnBlur.bind(this);
        // this._contentEditableDiv.onpaste = this.catchPaste.bind(this);
        this._observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.enforceHierarchy(mutation);
                }
            })
        });
        this._observer.observe(this._contentEditableDiv, { childList: true, subtree: true });
    
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
        // Disable pasting, undo, redo and composition text
        const blockedInputTypes = ["insertFromPaste", "historyUndo", "historyRedo", "insertCompositionText"];
        if (blockedInputTypes.includes(e.inputType)) {
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
            
            this._addNewCharacter(eventKey, fontSize)
            if (!this._isTimerRunning) {
                this.startTimer();
            }
        } 
    }

    enforceHierarchy (mutation) {
        mutation.addedNodes.forEach(addedNode => {
            if (addedNode.nodeType === Node.ELEMENT_NODE) {
                const addedNodeLevel = this._getNodeLevel(addedNode);
                if (addedNodeLevel === this.CONTENT_EDITABLE_LEVEL) {
                    // do nothing
                } else if (addedNodeLevel === this.SECTION_DIV_LEVEL) {
                    if (addedNode.nodeName === 'BR') {
                        // On "delete all", a BR is sometimes added at this level. In that case, addedNode should be deleted.
                        addedNode.remove();
                    } else if (addedNode.nodeName === 'SPAN') {
                        // If a SPAN is being added at this level, wrap it in a SECTION DIV.
                        const newSection = document.createElement("div");
                        addedNode.replaceWith(newSection);
                        newSection.appendChild(addedNode);
                        this._range.setStartAfter(addedNode);
                        this._range.collapse(true);
                        this._selection.removeAllRanges();
                        this._selection.addRange(this._range);
                    }
                } else if (addedNodeLevel === this.CHAR_CONTAINER_LEVEL) {
                    // do nothing
                } else if (addedNodeLevel === this.TEXT_NODE_LEVEL) {
                    // do nothing
                }
            }
        });
    }

    _addNewCharacter (char, fontSize) {
        /**
         * DOM Structure:
         *      > content-editable
         *          > section-div
         *              > char-container
         *                  > IF EMPTY: br
         *                  > IF NOT EMPTY: text-node
         */

        const newTextElem = document.createElement("span");
        newTextElem.innerText = char;
        newTextElem.style.fontSize = fontSize;
        newTextElem.classList.add("char-container");

        let anchorNode = document.getSelection().anchorNode;
        let anchorNodeOffset = document.getSelection().anchorOffset;

        let focusNode = document.getSelection().focusNode;
        let focusNodeOffset = document.getSelection().focusOffset;

        if (anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_PRECEDING) {
            const anchorNodeTemp = anchorNode;
            const anchorNodeOffsetTemp = anchorNodeOffset;

            anchorNode = focusNode;
            anchorNodeOffset = focusNodeOffset;

            focusNode = anchorNodeTemp;
            focusNodeOffset = anchorNodeOffsetTemp;
        }
        
        const anchorNodeLevel = this._getNodeLevel(anchorNode);
        if (anchorNodeLevel === this.CONTENT_EDITABLE_LEVEL) {
            this._setNewTextForContentEditableSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
        } else if (anchorNodeLevel === this.SECTION_DIV_LEVEL) {
            this._setNewTextForSectionDivSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
        } else if (anchorNodeLevel === this.CHAR_CONTAINER_LEVEL) {
            this._setNewTextForCharContainerSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
        } else if (anchorNodeLevel === this.TEXT_NODE_LEVEL) {
            this._setNewTextForTextSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
        }
    }

    _setNewTextForContentEditableSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset) {
        console.log("Content Editable Selected");
        const anchorNodeLevel = this._getNodeLevel(anchorNode);
        const focusNodeLevel = this._getNodeLevel(focusNode);
        if (anchorNodeLevel !== this.CONTENT_EDITABLE_LEVEL) {
            console.log("Aborted (Bad Anchor Node)");
            return;
        }
        if (focusNodeLevel !== this.CONTENT_EDITABLE_LEVEL) {
            console.log("Aborted (Bad Focus Node)");
            return;
        }

        const sectionDivs = this._contentEditableDiv.children;
        if (sectionDivs.length === 0) {
            // Typing in an empty document
            const newSection = document.createElement("div");
            newSection.appendChild(newTextElem);
            this._contentEditableDiv.appendChild(newSection);
            
            this._range.setStartAfter(newSection.children[0], 0);
            this._range.collapse(true);
        } else {
            // Reload existing non-empty document then type
            this._range.setStart(anchorNode.children[0], 0);
            this._range.collapse(true);
            this._range.insertNode(newTextElem);
            this._range.collapse();
        }
        this._selection.removeAllRanges();
        this._selection.addRange(this._range);
    }

    _setNewTextForSectionDivSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset) {
        console.log("Section Div Selected");
        const anchorNodeLevel = this._getNodeLevel(anchorNode);
        const focusNodeLevel = this._getNodeLevel(focusNode);
        if (anchorNodeLevel !== this.SECTION_DIV_LEVEL) {
            console.log("Aborted (Bad Anchor Node)");
            return;
        }
        if (focusNodeLevel === this.CONTENT_EDITABLE_LEVEL) {
            console.log("Aborted (Bad Focus Node)");
            return;
        }
            
        this._range.setStart(anchorNode, anchorNodeOffset);
        this._range.collapse(true);
        this._range.insertNode(newTextElem);

        let focusNodeShiftAfterInsert;
        if (focusNodeLevel === this.SECTION_DIV_LEVEL) {
            focusNodeShiftAfterInsert = (anchorNode === focusNode) ? 1 : 0;
        } else if (focusNodeLevel === this.CHAR_CONTAINER_LEVEL) {
            console.log("SUPPORT SECTION DIV -> CHAR CONTAINER");
            return;
        } else if (focusNodeLevel === this.TEXT_NODE_LEVEL) {
            focusNodeShiftAfterInsert = 0;
        }
        
        this._range.setStart(anchorNode, anchorNodeOffset + 1);
        this._range.setEnd(focusNode, focusNodeOffset + focusNodeShiftAfterInsert);
        this._range.deleteContents();
        this._range.setStart(anchorNode, anchorNodeOffset + 1);

        this._range.collapse(true);
        this._selection.removeAllRanges();
        this._selection.addRange(this._range);
    }

    _setNewTextForCharContainerSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset) {
        console.log("Char Container Selected");
        const anchorNodeLevel = this._getNodeLevel(anchorNode);
        const focusNodeLevel = this._getNodeLevel(focusNode);
        if (anchorNodeLevel !== this.CHAR_CONTAINER_LEVEL) {
            console.log("Aborted (Bad Anchor Node)");
            return;
        }
        if (focusNodeLevel === this.CONTENT_EDITABLE_LEVEL) {
            console.log("Aborted (Bad Focus Node)");
            return;
        }

        // Replace char-container containing br in new section
        if (anchorNode === focusNode && anchorNode.innerHTML === '<br>') {
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

        if (focusNodeLevel === this.CHAR_CONTAINER_LEVEL) {
            console.log("SUPPORT CHAR CONTAINER -> CHAR CONTAINER");
            return;
        } 
        
        // focusNodeLevel === this.SECTION_DIV_LEVEL OR focusNodeLevel === this.TEXT_NODE_LEVEL) {
        const sectionDivNodes = this._contentEditableDiv.children;

        const selectedSectionIdx = [...this._contentEditableDiv.children].indexOf(anchorNode.parentNode);
        const selectedSection = sectionDivNodes[selectedSectionIdx];
        const charContainerNodesInSection = selectedSection.children;
        const charContainerNodeIdx = [...selectedSection.children].indexOf(anchorNode);
        
        this._range.setStartBefore(charContainerNodesInSection[charContainerNodeIdx]);
        this._range.setEndAfter(focusNode);
        this._range.deleteContents();
        this._range.insertNode(newTextElem);
        
        this._range.setStartAfter(newTextElem);
        this._range.collapse(true);
        this._selection.removeAllRanges();
        this._selection.addRange(this._range);
        
    }

    _setNewTextForTextSelected (newTextElem, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset) {
        console.log("Text Node Selected");
        const anchorNodeLevel = this._getNodeLevel(anchorNode);
        const focusNodeLevel = this._getNodeLevel(focusNode);
        if (anchorNodeLevel !== this.TEXT_NODE_LEVEL) {
            console.log("Aborted (Bad Anchor Node)");
            return;
        }
        if (focusNodeLevel === this.CONTENT_EDITABLE_LEVEL) {
            console.log("Aborted (Bad Focus Node)");
            return;
        }

        const sectionDivNodes = this._contentEditableDiv.children;
        
        const anchorNodeSectionIdx = [...sectionDivNodes].indexOf(anchorNode.parentNode.parentNode);
        const anchorNodeSection = sectionDivNodes[anchorNodeSectionIdx];
        const anchorNodeCharContainerIdx = [...anchorNodeSection.children].indexOf(anchorNode.parentNode);

        let focusNodeSectionIdx;
        let focusNodeSection;
        let focusNodeCharContainerIdx;
        let anchorNodeShiftAfterInsert;
        let focusNodeShiftAfterInsert;

        if (focusNodeLevel === this.SECTION_DIV_LEVEL) {
            focusNodeSectionIdx = [...sectionDivNodes].indexOf(focusNode);
            focusNodeSection = sectionDivNodes[focusNodeSectionIdx];
            focusNodeCharContainerIdx = 0;
            anchorNodeShiftAfterInsert = 1;
            focusNodeShiftAfterInsert = 0;
        } else if (focusNodeLevel === this.CHAR_CONTAINER_LEVEL) {
            console.log("SUPPORT TEXT NODE -> CHAR CONTAINER");
            return;
        } else if (focusNodeLevel === this.TEXT_NODE_LEVEL) {
            focusNodeSectionIdx = [...sectionDivNodes].indexOf(focusNode.parentNode.parentNode);
            focusNodeSection = sectionDivNodes[focusNodeSectionIdx];
            focusNodeCharContainerIdx = [...focusNodeSection.children].indexOf(focusNode.parentNode);
            anchorNodeShiftAfterInsert = 1;
            focusNodeShiftAfterInsert = (anchorNodeSectionIdx === focusNodeSectionIdx) ? 1 : 0; 
        }
        this._range.setStart(anchorNodeSection, anchorNodeCharContainerIdx + anchorNodeOffset);
        this._range.insertNode(newTextElem);

        this._range.setStart(anchorNodeSection, anchorNodeCharContainerIdx + anchorNodeOffset + anchorNodeShiftAfterInsert);
        this._range.setEnd(focusNodeSection, focusNodeCharContainerIdx + focusNodeOffset + focusNodeShiftAfterInsert);
        this._range.deleteContents();
        this._range.setStart(anchorNodeSection, anchorNodeCharContainerIdx + anchorNodeOffset + 1);
        this._range.collapse(true);

        this._selection.removeAllRanges();
        this._selection.addRange(this._range);
    }

    _getNodeLevel (node) {
        if (node === this._contentEditableDiv) { // content-editable level
            return this.CONTENT_EDITABLE_LEVEL;
        } else if (node?.parentNode === this._contentEditableDiv) { // section div level
            return this.SECTION_DIV_LEVEL;
        } else if (node?.parentNode?.parentNode === this._contentEditableDiv) { // char-container level
            return this.CHAR_CONTAINER_LEVEL;
        } else if (node?.parentNode?.parentNode?.parentNode === this._contentEditableDiv) { // text level
            return this.TEXT_NODE_LEVEL;
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
