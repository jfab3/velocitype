import Quill from 'quill'

const Inline = Quill.import('blots/inline');

class FontSizeBlot extends Inline {
    static blotName = 'fontSizeBlot';
    static tagName = 'div'

    static create(value) {
        const node = super.create();

        node.style.fontSize = value;
        node.style.display = 'inline'; // For some reason cannot set tagName to span

        return node;
    }
}

export default FontSizeBlot;