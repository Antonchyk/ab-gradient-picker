export function dragElement(domElement: HTMLElement, dragZoneElemSelector: string) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragPoint = domElement.querySelector(dragZoneElemSelector) as HTMLElement;
    if (dragPoint) {
        dragPoint.onmousedown = dragMouseDown;
    } else {
        domElement.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e: Event) {
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = (e as MouseEvent).clientX;
        pos4 = (e as MouseEvent).clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e: Event) {
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

export function makeResizableDiv(domElement: HTMLElement, onResizeCb?: () => void) {
    const resizerElemRight = document.createElement('div');
    resizerElemRight.style.width = '2px';
    resizerElemRight.style.height = '100%';
    resizerElemRight.style.position = 'absolute';
    resizerElemRight.style.top = '0';
    resizerElemRight.style.right = '0';
    resizerElemRight.style.cursor = 'ew-resize';
    domElement.appendChild(resizerElemRight);

    const resizerElemLeft = document.createElement('div');
    resizerElemLeft.style.width = '2px';
    resizerElemLeft.style.height = '100%';
    resizerElemLeft.style.position = 'absolute';
    resizerElemLeft.style.top = '0';
    resizerElemLeft.style.left = '0';
    resizerElemLeft.style.cursor = 'ew-resize';
    domElement.appendChild(resizerElemLeft);

    let initWidth = 0;
    let initLeft = 0;

    resizerElemRight.addEventListener('mousedown', function (e) {
        e.preventDefault()
        window.addEventListener('mousemove', resizeRight)
        window.addEventListener('mouseup', stopResize)
    });

    resizerElemLeft.addEventListener('mousedown', function (e) {
        initWidth = domElement.getBoundingClientRect().width;
        initLeft = e.pageX;
        e.preventDefault()
        window.addEventListener('mousemove', resizeLeft)
        window.addEventListener('mouseup', stopResize)
    });

    function resizeRight(e: MouseEvent) {
        domElement.style.width = e.pageX - domElement.getBoundingClientRect().left + 'px';
        if (onResizeCb) {
            onResizeCb();
        }
    }

    function resizeLeft(e: MouseEvent) {
        domElement.style.left = e.pageX + 'px';
        domElement.style.width = initWidth + (initLeft - e.pageX) + 'px';
        if (onResizeCb) {
            onResizeCb();
        }
    }

    function stopResize() {
        window.removeEventListener('mousemove', resizeRight);
        window.removeEventListener('mousemove', resizeLeft);
    }
}

export function centerElem(domElem: HTMLElement) {
    const rect = domElem.getBoundingClientRect();
    domElem.style.left = (window.innerWidth / 2) - (rect.width / 2) + 'px';
    domElem.style.top = (window.innerHeight / 2) - (rect.height / 2) + 'px';
}

export function getGradientString(colors: { color: string, position: number }[]): string {
    let value;
    if (colors.length === 1) {
        value = `${colors[0].color}`
    } else {
        value = `linear-gradient(to right, `;
        for (let i = 0; i < colors.length; i++) {
            value += `${colors[i].color} ${colors[i].position}%${i === colors.length - 1 ? `` : `,`}`;
        }
        value += `)`;
    }
    return value;
}


export function getElementCssWidth(className: string): number {
    const el = document.createElement('div');
    el.className = className;
    document.body.appendChild(el);
    const css = el.getBoundingClientRect();
    document.body.removeChild(el);
    return css.width;
}

