import { expect, test } from 'vitest'
import TextEditor from '../src/components/TextEditor';

test('_setNewTextForContentEditableSelected empty document', () => {
  /**
   * |
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  
  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("a"));
  const anchorNode = textEditor._contentEditableDiv;
  const anchorNodeOffset = 0;
  const focusNode = anchorNode;
  const focusNodeOffset = 0;

  textEditor._setNewTextForContentEditableSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const expectedContent = "<div><span>a</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain one section with one character.").toBe(expectedContent);
  expect(textEditor._range.startContainer.outerHTML,
    "Range should start in the first section").toBe(textEditor._contentEditableDiv.children[0].outerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the first character in the section").toBe(1);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
})

test('_setNewTextForContentEditableSelected non-empty document', () => {
  /**
   * |a
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><span>b</span></div>";
  
  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("a"));
  const anchorNode = textEditor._contentEditableDiv;
  const anchorNodeOffset = 0;
  const focusNode = anchorNode;
  const focusNodeOffset = 0;

  textEditor._setNewTextForContentEditableSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const expectedContent = "<div><span>a</span><span>b</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain one section with two characters.").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the first section").toBe(textEditor._contentEditableDiv.children[0].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the first character in the section").toBe(1);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
})

test('_setNewTextForSectionDivSelected after existing character', () => {
  /**
   * a|
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><span>a</span></div>";

  const sampleSpan1 = document.createElement("span");
  sampleSpan1.appendChild(document.createTextNode("b"));
  const anchorNode1 = textEditor._contentEditableDiv.children[0];
  let anchorNodeOffset1 = 1;
  const focusNode1 = anchorNode1;
  let focusNodeOffset1 = anchorNodeOffset1;

  textEditor._setNewTextForSectionDivSelected(sampleSpan1, anchorNode1, anchorNodeOffset1, focusNode1, focusNodeOffset1);
  const expectedContent1 = "<div><span>a</span><span>b</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain one section with two characters.").toBe(expectedContent1);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the first section").toBe(textEditor._contentEditableDiv.children[0].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the second character in the section").toBe(2);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);


  const sampleSpan2 = document.createElement("span");
  sampleSpan2.appendChild(document.createTextNode("c"));
  const anchorNode2 = textEditor._contentEditableDiv.children[0];
  const anchorNodeOffset2 = 2;
  const focusNode2 = anchorNode2;
  const focusNodeOffset2 = anchorNodeOffset2;
  textEditor._setNewTextForSectionDivSelected(sampleSpan2, anchorNode2, anchorNodeOffset2, focusNode2, focusNodeOffset2);
  const expectedContent2 = "<div><span>a</span><span>b</span><span>c</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain one section with three characters.").toBe(expectedContent2);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the first section").toBe(textEditor._contentEditableDiv.children[0].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the third character in the section").toBe(3);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
})

test('_setNewTextForSectionDivSelected starting on a newline and ending on a character (focus node is a SECTION DIV)', () => {
  /**
   * 
   * |
   * ab|c
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><br></div><div><br></div><div><span>a</span><span>b</span><span>c</span></div>";

  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("e"));
  const anchorNode = textEditor._contentEditableDiv.children[1];
  let anchorNodeOffset = 0;
  const focusNode = textEditor._contentEditableDiv.children[2];
  let focusNodeOffset = 2;

  textEditor._setNewTextForSectionDivSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const expectedContent = "<div><br></div><div><span>e</span></div><div><span>c</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain three section with two characters total").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the second section").toBe(textEditor._contentEditableDiv.children[1].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the first character in the section").toBe(1);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
})

test('_setNewTextForSectionDivSelected starting on a newline and ending on a character (focus node is a TEXT NODE)', () => {
  /**
   * 
   * |
   * ab|c
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><br></div><div><br></div><div><span>a</span><span>b</span><span>c</span></div>";

  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("e"));
  const anchorNode = textEditor._contentEditableDiv.children[1];
  let anchorNodeOffset = 0;
  const focusNode = textEditor._contentEditableDiv.children[2].children[1].childNodes[0];
  let focusNodeOffset = 1;

  textEditor._setNewTextForSectionDivSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  // Empty span is left-over on the third line (unintended)
  const expectedContent = "<div><br></div><div><span>e</span></div><div><span></span><span>c</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain three section with two characters total").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the second section").toBe(textEditor._contentEditableDiv.children[1].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the first character in the section").toBe(1);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
})

test('_setNewTextForSectionDivSelected document with two empty newlines', () => {
  /**
   * 
   * |
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><br></div><div><br></div>";

  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("a"));
  const anchorNode = textEditor._contentEditableDiv.children[1];
  let anchorNodeOffset = 0;
  const focusNode = anchorNode
  let focusNodeOffset = anchorNodeOffset;

  textEditor._setNewTextForSectionDivSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const expectedContent = "<div><br></div><div><span>a</span><br></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain two sections with one character total").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the second section").toBe(textEditor._contentEditableDiv.children[1].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the first character in the section").toBe(1);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
})

test('_setNewTextForCharContainerSelected on an empty newline', () => {
  /**
   * abc
   * |
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><span>a</span><span>b</span><span>c</span></div><div><span><br></span></div>";

  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("d"));
  const anchorNode = textEditor._contentEditableDiv.children[1].children[0];
  let anchorNodeOffset = 0;
  const focusNode = anchorNode
  let focusNodeOffset = anchorNodeOffset;

  textEditor._setNewTextForCharContainerSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const expectedContent = "<div><span>a</span><span>b</span><span>c</span></div><div><span>d</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain two sections with four character total").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the second section").toBe(textEditor._contentEditableDiv.children[1].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the first character in the section").toBe(1);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
})

test('_setNewTextForCharContainerSelected from one empty newline to another empty newline (focus node is a SECTION DIV)', () => {
  /**
   * |
   * abc
   * |
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><span><br></span></div><div><span>a</span><span>b</span><span>c</span></div><div><span><br></span></div>";

  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("d"));
  const anchorNode = textEditor._contentEditableDiv.children[0].children[0];
  const anchorNodeOffset = 0;
  const focusNode = textEditor._contentEditableDiv.children[2];
  const focusNodeOffset = 0;

  textEditor._setNewTextForCharContainerSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const mutation = { addedNodes: [sampleSpan] };
  textEditor.enforceHierarchy(mutation);
  // Empty div is left-over at the top of the document (unintended)
  const expectedContent = "<div></div><div><span>d</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML, 
    "Content Editable div should contain two sections with one character total").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the second section").toBe(textEditor._contentEditableDiv.children[1].innerHTML);
  expect(textEditor._range.startOffset, 
    "Range should start after the first character in the section").toBe(1);
  expect(textEditor._range.collapsed, 
    "Range should be empty").toBe(true);
});

test('_setNewTextForTextSelected between two characters', () => {
  /**
   * a|c
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><span>a</span><span>c</span></div>";

  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("b"));
  const anchorNode = textEditor._contentEditableDiv.children[0].children[0].childNodes[0];
  const anchorNodeOffset = 1;
  const focusNode = anchorNode;
  const focusNodeOffset = anchorNodeOffset;

  textEditor._setNewTextForTextSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const expectedContent = "<div><span>a</span><span>b</span><span>c</span></div>";

  expect(textEditor._contentEditableDiv.innerHTML,
    "Content Editable div should contain one section with three characters total").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the first section").toBe(textEditor._contentEditableDiv.children[0].innerHTML);
  expect(textEditor._range.startOffset,
    "Range should start after the second character in the section").toBe(2);
  expect(textEditor._range.collapsed,
    "Range should be empty").toBe(true);
})

test('_setNewTextForTextSelected from character to empty newline below', () => {
  /**
   * a|bc
   * |
   */
  const div = document.createElement("div");
  const textEditor = new TextEditor(div, "fakeDocId", "fakeUser", false);
  textEditor._contentEditableDiv.innerHTML = "<div><span>a</span><span>b</span><span>c</span></div><div><span><br></span></div>";

  const sampleSpan = document.createElement("span");
  sampleSpan.appendChild(document.createTextNode("d"));
  const anchorNode = textEditor._contentEditableDiv.children[0].children[0].childNodes[0];
  const anchorNodeOffset = 1;
  const focusNode = textEditor._contentEditableDiv.children[1]
  const focusNodeOffset = 0;

  textEditor._setNewTextForTextSelected(sampleSpan, anchorNode, anchorNodeOffset, focusNode, focusNodeOffset);
  const expectedContent = "<div><span>a</span><span>d</span></div><div><span><br></span></div>";

  expect(textEditor._contentEditableDiv.innerHTML,
    "Content Editable div should contain one section with two characters total").toBe(expectedContent);
  expect(textEditor._range.startContainer.innerHTML,
    "Range should start in the first section").toBe(textEditor._contentEditableDiv.children[0].innerHTML);
  expect(textEditor._range.startOffset,
    "Range should start after the second character in the section").toBe(2);
  expect(textEditor._range.collapsed,
    "Range should be empty").toBe(true);
})