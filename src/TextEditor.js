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
        this._rangeInit = false;
        this._selection = window.getSelection();

        div.appendChild(this._contentEditableDiv);
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
            // e.stopPropagation();
            // e.preventDefault();
            return;
        }

        const eventKey = e.data;
        // not a good way to check, just for the time being...
        if (eventKey !== null) {
            e.stopPropagation();
            e.preventDefault();
            this._numTextChanges += 1;
            const speed = this._calculateSpeed();
            
            const span = document.createElement("span");
            span.innerText = eventKey;
            span.style.fontSize = `${speed * 12 + 8}px`;
            span.classList.add("text-span");

            this._setNewText(span);
            if (!this._isTimerRunning) {
                this.startTimer();
            }
        } else if (e.inputType === "insertParagraph") {
            e.stopPropagation();
            e.preventDefault();
            const br = document.createElement("br");
            this._setNewText(br);
        } 
    }

    _setNewText (span) {
        const selectedNode = document.getSelection().anchorNode;
        
        if (selectedNode === this._contentEditableDiv) { // content-editable selected
            if (this._rangeInit) {
                this._range.collapse(true);
                this._range.insertNode(span);
                this._range.collapse();
    
                this._selection.removeAllRanges();
                this._selection.addRange(this._range);
            } else {
                selectedNode.appendChild(span);
            }
        } else if (selectedNode.parentNode === this._contentEditableDiv) { // text-span selected
            const selectedNodeIdx = [...selectedNode.parentNode.children].indexOf(selectedNode.previousSibling);
            const childrenNodes = this._contentEditableDiv.children;
            
            this._range.setStartAfter(childrenNodes[selectedNodeIdx], 0);
            this._range.collapse(true);
            this._range.insertNode(span);
            this._range.setStartAfter(childrenNodes[selectedNodeIdx + 1], 0);
            this._range.collapse(true);
            this._rangeInit = true;

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        } else if (selectedNode.parentNode.parentNode === this._contentEditableDiv) { // text selected
            const selectedNodeIdx = [...selectedNode.parentNode.parentNode.children].indexOf(selectedNode.parentNode);
            const childrenNodes = this._contentEditableDiv.children;
            
            this._range.setStartAfter(childrenNodes[selectedNodeIdx], 0);
            this._range.collapse(true);
            this._range.insertNode(span);
            this._range.setStartAfter(childrenNodes[selectedNodeIdx + 1], 0);
            this._range.collapse(true);
            this._rangeInit = true;

            this._selection.removeAllRanges();
            this._selection.addRange(this._range);
        } else {
            return span.outerHTML;
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
