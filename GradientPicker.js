const gradientPicker = (currentColors) => {

    const observers = [];
    let $popup = null;
    let $gradientScreen = null;
    let $stopsContainer = null;
    let $closeButton = null;
    let $deleteStopButton = null;
    let $positionInput = null;
    let $colorInput;
    let $header;
    let isBeingDragged = false;
    let draggedStop = null;
    let activeIndex = 0;
    const STOP_CENTER = getStopItemWidth() / 2;

    const gpColorStops = JSON.parse(JSON.stringify(currentColors));

    createPopup();

    // region model
    function addColorStop(position) {
        gpColorStops.push({
            color: '#ffffff',
            position: getRelativeOffset($stopsContainer, position),
        });
        sortColors();
        triggerChange();
    }

    function removeColorStop() {
        if (gpColorStops.length === 1) {
            return;
        }
        gpColorStops.splice(activeIndex, 1);
        sortColors();
        triggerChange();
    }

    function sortColors() {
        gpColorStops.sort((a, b) => a.position - b.position);
    }

    function changePosition(value, index) {
        if (value > 100 || value < 0) {
            return;
        }
        gpColorStops[index].position = value;
        triggerChange();
    }

    function changeColor(value) {
        gpColorStops[activeIndex].color = value;
        triggerChange();
    }

    function onChange(cb) {
        observers.push(cb);
    }

    function triggerChange() {
        observers.map(cb => cb(gpColorStops));
    }

    // endregion

    function setActive(index) {
        activeIndex = index;
        render();
    }

    function onPositionChanged(e) {
        changePosition(parseFloat(e.target.value), activeIndex);
        render();
    }

    function onColorAdded(e) {
        addColorStop(e.offsetX);
        const activeStopIndex = gpColorStops.findIndex(i => i.position === getRelativeOffset(e.target, e.offsetX));
        if (activeStopIndex > -1) {
            setActive(activeStopIndex);
        }
    }

    function onColorStopChange(e) {
        changeColor(e.target.value);
        render();
    }

    function onColorStopRemoved() {
        removeColorStop();
        setActive(0);
    }

    function createPopup() {
        const template = `<div class="gp-header">Gradient Picker</div>
                          <div class="gp-wrapper">
                              <div class="gradient-screen"></div>
                              <div class="stops-container"></div>
                              <div class="gp-stop-info">
                                <span class="gp-stops-title">Stops</span>
                                <div class="input-item">
                                    <label for="color_picker">Color:</label>
                                    <input type="color" id="color_picker" class="gp-color-input">
                                </div>
                                <div class="input-item">
                                    <label for="location">Location:</label>
                                    <input type="number" id="location" min="0" max="100" class="gp-location-input">
                                    <span>%</span>
                                </div>
                                <div class="input-item">
                                    <button type="button" class="gp-delete-stop">Delete</button>
                                </div>
                              </div>                        
                          </div>
                           <div id="gp_close" class="gp-close"></div>`;
        $popup = document.createElement('div');
        $popup.className = 'gp-container';
        $popup.innerHTML = template;
        window.document.body.appendChild($popup);
        addEventHandlers();
        setActive(0);
    }

    function addEventHandlers() {
        $gradientScreen = $popup.querySelector('.gradient-screen');
        $stopsContainer = $popup.querySelector('.stops-container');
        $closeButton = $popup.querySelector('.gp-close');
        $deleteStopButton = $popup.querySelector('.gp-delete-stop');
        $positionInput = $popup.querySelector('#location');
        $colorInput = $popup.querySelector('#color_picker');
        $header = $popup.querySelector('.gp-header');


        $closeButton.addEventListener('click', close, false);

        $stopsContainer.addEventListener('dblclick', onColorAdded, false);

        $stopsContainer.addEventListener('mousedown', startMoveColorStop, false);
        $stopsContainer.addEventListener('mousemove', moveColorStop, false);
        $stopsContainer.addEventListener('mouseup', stopMoveColorStop, false);

        $deleteStopButton.addEventListener('click', onColorStopRemoved);

        document.body.addEventListener('mouseup', () => {
            isBeingDragged = false;
        }, true);

        $positionInput.addEventListener('change', onPositionChanged);
        $colorInput.addEventListener('change', onColorStopChange);
        dragElement($popup, '.gp-header');
    }

    function close() {
        window.document.body.removeChild($popup);
        $popup = null;
    }

    function renderGradients() {
        let value;
        if (gpColorStops.length === 1) {
            value = `${gpColorStops[0].color}`
        } else {
            value = `linear-gradient(to right, `;
            for (let i = 0; i < gpColorStops.length; i++) {
                value += `${gpColorStops[i].color} ${gpColorStops[i].position}%${i === gpColorStops.length - 1 ? `` : `,`}`;
            }
            value += `)`;
        }
        $gradientScreen.style.background = value;
    }

    function renderStops() {
        if (isBeingDragged) {
            return;
        }
        if ($stopsContainer.children.length !== gpColorStops.length) {
            clearNode($stopsContainer);
            for (let i = 0; i < gpColorStops.length; i++) {
                $stopsContainer.appendChild(createStop(gpColorStops[i], i));
            }
        } else {
            for (let i = 0; i < $stopsContainer.children.length; i++) {
                const el = $stopsContainer.children[i];
                el.classList.remove('active');
                el.style.background = gpColorStops[i].color;
                el.style.transform = `translate3d(${getAbsoluteOffset($stopsContainer, gpColorStops[i].position) - STOP_CENTER}px, 0, 0)`;
            }
            $stopsContainer.children[activeIndex].classList.add('active');
        }
    }

    function renderLocationInput() {
        $positionInput.value = gpColorStops[activeIndex].position;
    }

    function renderColorInput() {
        $colorInput.value = gpColorStops[activeIndex].color;
    }

    function render() {
        renderStops();
        renderGradients();
        renderLocationInput();
        renderColorInput();
    }

    function createStop(item, index) {
        const elem = document.createElement('div');
        elem.className = `stop-item ${index === activeIndex ? `active` : ``}`;
        elem.dataset.index = index;
        elem.style.background = item.color;
        elem.style.transform = `translate3d(${getAbsoluteOffset($stopsContainer, item.position) - STOP_CENTER}px, 0, 0)`;
        elem.addEventListener('mousedown', () => {
            setActive(index);
            draggedStop = elem;
        }, false);
        elem.addEventListener('drag', (e) => {
            e.preventDefault();
        }, false);
        elem.addEventListener('dragstart', (e) => {
            e.preventDefault();
        }, false);
        elem.addEventListener('dragend', (e) => {
            e.preventDefault();
        }, false);

        return elem;
    }

    // region stop move
    let stopsContainerRect = null;

    function moveColorStop(e) {
        if (!isBeingDragged) {
            return;
        }
        e.preventDefault();
        const x = e.clientX - stopsContainerRect.left;
        if (stopsContainerRect.width <= x) {
            return;
        }
        if (x < 0) {
            return;
        }
        draggedStop.style.transform = `translate3d(${x - STOP_CENTER}px, 0, 0)`;
        changePosition(getRelativeOffset($stopsContainer, x), parseInt(draggedStop.dataset.index));
        renderGradients();
        renderLocationInput();
    }

    function startMoveColorStop(e) {
        if (e.target === draggedStop) {
            isBeingDragged = true;
        }
        stopsContainerRect = $stopsContainer.getBoundingClientRect();
    }

    function stopMoveColorStop() {
        isBeingDragged = false;
    }

    // endregion

    // region utils
    function getAbsoluteOffset(domElem, relativeOffset) {
        return domElem.offsetWidth * (relativeOffset / 100);
    }

    function getRelativeOffset(domElem, absoluteOffset) {
        return parseFloat(((absoluteOffset / domElem.offsetWidth) * 100).toFixed(2));
    }

    function clearNode(node) {
        node.querySelectorAll('*').forEach(n => n.remove());
    }

    // endregion

    // // region popup move
    //
    // function dragElement(domElement, dragZoneElemSelector) {
    //     let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    //     const dragPoint = domElement.querySelector(dragZoneElemSelector)
    //     if (dragPoint) {
    //         dragPoint.onmousedown = dragMouseDown;
    //     } else {
    //         domElement.onmousedown = dragMouseDown;
    //     }
    //
    //     function dragMouseDown(e) {
    //         e = e || window.event;
    //         e.preventDefault();
    //         // get the mouse cursor position at startup:
    //         pos3 = e.clientX;
    //         pos4 = e.clientY;
    //         document.onmouseup = closeDragElement;
    //         // call a function whenever the cursor moves:
    //         document.onmousemove = elementDrag;
    //     }
    //
    //     function elementDrag(e) {
    //         e = e || window.event;
    //         e.preventDefault();
    //         // calculate the new cursor position:
    //         pos1 = pos3 - e.clientX;
    //         pos2 = pos4 - e.clientY;
    //         pos3 = e.clientX;
    //         pos4 = e.clientY;
    //         // set the element's new position:
    //         domElement.style.top = (domElement.offsetTop - pos2) + "px";
    //         domElement.style.left = (domElement.offsetLeft - pos1) + "px";
    //     }
    //
    //     function closeDragElement() {
    //         // stop moving when mouse button is released:
    //         document.onmouseup = null;
    //         document.onmousemove = null;
    //     }
    // }
    //
    // // endregion

    function getStopItemWidth() {
        const el = document.createElement('div');
        el.className = 'stop-item';
        document.body.appendChild(el);
        const css = el.getBoundingClientRect();
        document.body.removeChild(el);
        return css.width;
    }

    return {
        onChange: onChange
    }
}
