export function dragElement(domElement: HTMLElement, dragZoneElemSelector: string) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragPoint = domElement.querySelector(dragZoneElemSelector) as HTMLElement;
    if (dragPoint) {
        dragPoint.onmousedown = dragMouseDown;
    } else {
        domElement.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e: Event) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = (e as MouseEvent).clientX;
        pos4 = (e as MouseEvent).clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e: Event) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - (e as MouseEvent).clientX;
        pos2 = pos4 - (e as MouseEvent).clientY;
        pos3 = (e as MouseEvent).clientX;
        pos4 = (e as MouseEvent).clientY;
        // set the element's new position:
        domElement.style.top = (domElement.offsetTop - pos2) + "px";
        domElement.style.left = (domElement.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

export function getAbsoluteOffset(domElem: Element, relativeOffset: number) {
    return (domElem as HTMLElement).offsetWidth * (relativeOffset / 100);
}

export function getRelativeOffset(domElem: Element, absoluteOffset: number) {
    return parseFloat(((absoluteOffset / (domElem as HTMLElement).offsetWidth) * 100).toFixed(2));
}

export function clearNode(node: Element) {
    node.querySelectorAll('*').forEach(n => n.remove());
}
