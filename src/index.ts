import {clearNode, dragElement, getAbsoluteOffset, getRelativeOffset} from "./utils";
import './styles/main.scss';

export interface IColorItem {
    color: string;
    position: number;
}

export interface IGradientPicker {
    onChange: (cb: (data: IColorItem[]) => void) => void;
}

export interface IGradientPickerConfig {
    initColors?: IColorItem[];
    zIndex?: number;
}

const DEFAULT_CONFIG: IGradientPickerConfig = {
    initColors: [
        {
            color: '#ffffff',
            position: 0,
        },
        {
            color: '#000000',
            position: 100,
        }
    ],
    zIndex: 999
}

export function createGradientPicker(config?: IGradientPickerConfig): IGradientPicker {

    // region config
    let gpConfig: IGradientPickerConfig = Object.assign({}, DEFAULT_CONFIG);
    if (config) {
        gpConfig = Object.assign(DEFAULT_CONFIG, config);
    }
    // endregion
    const observers: ((data: IColorItem[]) => void)[] = [];
    let isBeingDragged = false;
    let draggedStop: HTMLElement;
    let activeIndex = 0;
    const gpPrefix = 'ab-gp-';
    const STOP_CENTER = getStopItemWidth(gpPrefix) / 2;

    const gpColorStops = JSON.parse(JSON.stringify(gpConfig.initColors));

    const $popup = createPopup(gpConfig.zIndex);
    const $gradientScreen = $popup.querySelector(`.${gpPrefix}gradient-screen`);
    const $stopsContainer = $popup.querySelector(`.${gpPrefix}stops-container`);
    const $closeButton = $popup.querySelector(`.${gpPrefix}close`);
    const $deleteStopButton = $popup.querySelector(`.${gpPrefix}delete-stop`);
    const $positionInput = $popup.querySelector('#location') as HTMLInputElement;
    const $colorInput = $popup.querySelector('#color_picker') as HTMLInputElement;

    $closeButton?.addEventListener('click', close, false);
    $stopsContainer?.addEventListener('dblclick', onColorAdded, false);
    $stopsContainer?.addEventListener('mousedown', startMoveColorStop, false);
    $stopsContainer?.addEventListener('mousemove', moveColorStop, false);
    $stopsContainer?.addEventListener('mouseup', stopMoveColorStop, false);
    $deleteStopButton?.addEventListener('click', onColorStopRemoved);
    $positionInput?.addEventListener('change', onPositionChanged);
    $colorInput?.addEventListener('change', onColorStopChange);
    document.body.addEventListener('mouseup', () => {
        isBeingDragged = false;
    }, true);

    dragElement($popup, `.${gpPrefix}header`);
    setActive(0);

    // region model
    function addColorStop(position: number) {
        gpColorStops.push({
            color: '#ffffff',
            position: $stopsContainer ? getRelativeOffset($stopsContainer, position) : 0,
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
        gpColorStops.sort((a: IColorItem, b: IColorItem) => a.position - b.position);
    }

    function changePosition(value: number, index: number) {
        if (value > 100 || value < 0) {
            return;
        }
        gpColorStops[index].position = value;
        triggerChange();
    }

    function changeColor(value: string) {
        gpColorStops[activeIndex].color = value;
        triggerChange();
    }

    // endregion

    function triggerChange() {
        observers.map(cb => cb(gpColorStops));
    }

    function onChange(cb: (data: IColorItem[]) => void) {
        observers.push(cb);
    }

    function setActive(index: number) {
        activeIndex = index;
        render();
    }

    function onPositionChanged(e: Event) {
        if (e.target) {
            changePosition(parseFloat((e.target as HTMLInputElement).value), activeIndex);
        }
        render();
    }

    function onColorAdded(e: Event) {
        const offsetX = (e as MouseEvent).offsetX;
        addColorStop(offsetX);
        const activeStopIndex = gpColorStops.findIndex((i: IColorItem) => i.position === getRelativeOffset((e.target as HTMLElement), offsetX));
        if (activeStopIndex > -1) {
            setActive(activeStopIndex);
        }
    }

    function onColorStopChange(e: Event) {
        changeColor((e.target as HTMLInputElement).value);
        render();
    }

    function onColorStopRemoved() {
        removeColorStop();
        setActive(0);
    }

    function createPopup(zIndex?: number) {
        const template = `<div class="ab-gp-header">Gradient Picker</div>
                          <div class="ab-gp-wrapper">
                              <div class="ab-gp-gradient-screen"></div>
                              <div class="ab-gp-stops-container"></div>
                              <div class="ab-gp-stop-info">
                                <span class="ab-gp-stops-title">Stops</span>
                                <div class="ab-gp-input-item">
                                    <label for="color_picker">Color:</label>
                                    <input type="color" id="color_picker" class="ab-gp-color-input">
                                </div>
                                <div class="ab-gp-input-item">
                                    <label for="location">Location:</label>
                                    <input type="number" id="location" min="0" max="100" class="ab-gp-location-input">
                                    <span>%</span>
                                </div>
                                <div class="ab-gp-input-item">
                                    <button type="button" class="ab-gp-delete-stop">Delete</button>
                                </div>
                              </div>                        
                          </div>
                          <div id="gp_close" class="ab-gp-close"></div>`;
        const p = document.createElement('div');
        p.className = 'ab-gp-container';
        p.innerHTML = template;
        p.style.zIndex = zIndex ? zIndex.toString() : '';
        window.document.body.appendChild(p);
        return p;
    }

    function close() {
        window.document.body.removeChild($popup);
    }

    function renderGradients() {
        if (!$gradientScreen) {
            return;
        }
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
        ($gradientScreen as HTMLDivElement).style.background = value;
    }

    function renderStops() {
        if (isBeingDragged) {
            return;
        }
        if (!$stopsContainer) {
            return;
        }
        if ($stopsContainer.children.length !== gpColorStops.length) {
            clearNode($stopsContainer);
            for (let i = 0; i < gpColorStops.length; i++) {
                $stopsContainer.appendChild(createStop(gpColorStops[i], i) as Node);
            }
        } else {
            for (let i = 0; i < $stopsContainer.children.length; i++) {
                const el = $stopsContainer.children[i] as HTMLElement;
                el.classList.remove('active');
                el.style.background = gpColorStops[i].color;
                el.style.transform = `translate3d(${getAbsoluteOffset($stopsContainer, gpColorStops[i].position) - STOP_CENTER}px, 0, 0)`;
            }
            $stopsContainer.children[activeIndex].classList.add('active');
        }
    }

    function renderLocationInput() {
        if (!$positionInput) {
            return;
        }
        ($positionInput as HTMLInputElement).value = gpColorStops[activeIndex].position;
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

    function createStop(item: IColorItem, index: number) {
        if (!$stopsContainer) {
            return;
        }
        const elem = document.createElement('div') as HTMLDivElement;
        elem.className = `${gpPrefix}stop-item ${index === activeIndex ? `active` : ``}`;
        elem.dataset.index = index.toString();
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

    // region color-stop move
    let stopsContainerRect: DOMRect;

    function moveColorStop(e: Event) {
        if (!isBeingDragged) {
            return;
        }
        if (!$stopsContainer) {
            return;
        }
        e.preventDefault();
        const x = (e as MouseEvent).clientX - stopsContainerRect.left;
        if (stopsContainerRect.width <= x) {
            return;
        }
        if (x < 0) {
            return;
        }
        draggedStop.style.transform = `translate3d(${x - STOP_CENTER}px, 0, 0)`;
        changePosition(
            getRelativeOffset($stopsContainer, x),
            draggedStop.dataset.index ? parseInt(draggedStop.dataset.index) : 0
        );
        renderGradients();
        renderLocationInput();
    }

    function startMoveColorStop(e: Event) {
        if (!$stopsContainer) {
            return;
        }
        if (e.target === draggedStop) {
            isBeingDragged = true;
        }
        stopsContainerRect = $stopsContainer.getBoundingClientRect();
    }

    function stopMoveColorStop() {
        isBeingDragged = false;
    }

    // endregion

    function getStopItemWidth(prefix: string) {
        const el = document.createElement('div');
        el.className = `${prefix}stop-item`;
        document.body.appendChild(el);
        const css = el.getBoundingClientRect();
        document.body.removeChild(el);
        return css.width;
    }

    return {
        onChange: onChange
    }
}
