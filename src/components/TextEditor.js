class TextEditor {

    constructor (div) {        
        this._contentEditableDiv = document.createElement('div');
        this._contentEditableDiv.contentEditable = true;
        this._contentEditableDiv.spellcheck = false;
        this._contentEditableDiv.className = "content-editable-div";
        
        this._contentEditableDiv.onbeforeinput = this.handleKeyDown.bind(this);
        this._contentEditableDiv.onblur = this.stopTimer.bind(this);
        // this._contentEditableDiv.onpaste = this.catchPaste.bind(this);

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

    setTextAlignment (alignment) {
        this._contentEditableDiv.style.textAlign = alignment;
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

    handleKeyDown (e) {
        if (e.inputType === "insertFromPaste") {
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        this._numTextChanges += 1;
        const speed = this._calculateSpeed();
        const fontSize = `${speed * 12 + 8}px`;
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

    _setNewText (newTexElem) {
        /**
         * DOM Structure:
         *      content-editable
         *          section divs
         *              text-spans
         *                  text
         */

        const anchorNode = document.getSelection().anchorNode;
        const anchorNodeOffset = document.getSelection().anchorOffset;

        const focusNode = document.getSelection().focusNode;
        const focusNodeOffset = document.getSelection().focusOffset;
        
        if (anchorNode === this._contentEditableDiv) { // content-editable selected
            console.log("Content Editable Selected");
            const childrenNodes = this._contentEditableDiv.children;

            if (childrenNodes.length === 0) {
                const newSection = document.createElement("div");
                newSection.appendChild(newTexElem);
                this._contentEditableDiv.appendChild(newSection);
                this._range.setStartAfter(newSection.children[0], 0);
                this._range.collapse(true);

                this._selection.removeAllRanges();
                this._selection.addRange(this._range);
                return;
            }

            // Need to delete stale <BR> and <DIV><BR><DIV> that are sometimes left behind...

            this._range.collapse(true);
            this._range.insertNode(newTexElem);
            this._range.collapse();

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        } else if (anchorNode.parentNode === this._contentEditableDiv) { // section div selected
            console.log("Section Div Selected");
            this._range.collapse(true);
            this._range.insertNode(newTexElem);
            this._range.collapse();

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        } else if (anchorNode.parentNode.parentNode === this._contentEditableDiv) { // text-span selected
            console.log("Text Span Selected");

            // Find a better way to check this
            // Replace <br> in new paragraphs
            if (anchorNode.children && anchorNode.children[0].nodeName === 'BR') {
                this._range.setStartBefore(anchorNode);
                this._range.setEndAfter(anchorNode);
                this._range.deleteContents();
                this._range.insertNode(newTexElem);
                this._range.setStartAfter(newTexElem);
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
            this._range.insertNode(newTexElem);
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
            this._range.insertNode(newTexElem);
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
        if (lenTimeStampHistory == numRecentTimeStamps) {
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
