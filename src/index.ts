import {
    centerElem,
    clearNode,
    dragElement, dragElemInside,
    getAbsoluteOffset, getElementCssWidth,
    getGradientString,
    getRelativeOffset,
    makeResizableDiv
} from "./utils";
import './styles/main.scss';

export interface IColorItem {
    color: string;
    position: number;
}

export interface IGradientPicker {
    on: (key: string, cb: (data: IColorItem[]) => void) => void;

    setActiveColor(color: string): void;

    setColors(colors: IColorItem[]): void;

    getInputElement(): HTMLElement | null;

    getActiveColor(): string;

    show(): void;

    hide(): void;
}

export interface IGradientPickerConfig {
    initColors?: IColorItem[];
    zIndex?: number;
    isCustomColorPicker?: boolean;
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
    zIndex: 999,
    isCustomColorPicker: false,
}

const EVENTS = {
    DRAG_START: 'drag:start',
    DRAG_END: 'drag:end',
    CHANGE: 'change'
}

export function createGradientPicker(config?: IGradientPickerConfig): IGradientPicker {
    // region config
    let gpConfig: IGradientPickerConfig = Object.assign({}, DEFAULT_CONFIG);
    if (config) {
        gpConfig = Object.assign(DEFAULT_CONFIG, config);
    }
    // endregion
    let isBeingDragged = false;
    let draggedStop: HTMLElement;
    let activeIndex = 0;
    const gpPrefix = 'ab-gp-';
    const STOP_CENTER = getElementCssWidth(`${gpPrefix}stop-item`) / 2;
    let gpColorStops = JSON.parse(JSON.stringify(gpConfig.initColors));

    const $popup = createPopup();
    $popup.style.zIndex = gpConfig.zIndex ? gpConfig.zIndex.toString() : '';

    const $gradientScreen: HTMLElement | null = $popup.querySelector(`.${gpPrefix}gradient-screen`);
    const $stopsContainer: HTMLElement | null = $popup.querySelector(`.${gpPrefix}stops-container`);
    const $closeButton: HTMLElement | null = $popup.querySelector(`.${gpPrefix}close`);
    const $deleteStopButton: HTMLElement | null = $popup.querySelector(`.${gpPrefix}delete-stop`);
    const $positionInput: HTMLElement | null = $popup.querySelector(`.${gpPrefix}location-input`);
    const $colorDivInput: HTMLElement | null = $popup.querySelector(`.${gpPrefix}color-div-input`);

    if (!gpConfig.isCustomColorPicker) {
        const $colorInput = document.createElement('input');
        $colorInput.type = 'color';
        $colorInput.className = `${gpPrefix}inner-color-input`;
        $colorInput.addEventListener('change', onColorInputChange)
        $colorDivInput?.appendChild($colorInput);
    }

    $closeButton?.addEventListener('click', close, false);
    $stopsContainer?.addEventListener('dblclick', onColorAdded, false);
    $deleteStopButton?.addEventListener('click', onColorStopRemoved);
    $positionInput?.addEventListener('change', onPositionChanged);
    document.body.appendChild($popup);
    centerElem($popup);
    dragElement($popup, `.${gpPrefix}header`);
    makeResizableDiv($popup, renderStops);
    setActive(0);

    // region model
    function addColorStop(position: number) {
        gpColorStops.push({
            color: '#ffffff',
            position: $stopsContainer ? getRelativeOffset($stopsContainer, position) : 0,
        });
        sortColors();
    }

    function removeColorStop() {
        if (gpColorStops.length === 1) {
            return;
        }
        gpColorStops.splice(activeIndex, 1);
        sortColors();
    }

    function sortColors() {
        gpColorStops.sort((a: IColorItem, b: IColorItem) => a.position - b.position);
    }

    function changePosition(value: number, index: number) {
        if (value > 100 || value < 0) {
            return;
        }
        gpColorStops[index].position = value;
    }

    function changeColor(value: string) {
        gpColorStops[activeIndex].color = value;
    }

    function replaceColors(colors: IColorItem[]) {
        gpColorStops = colors;
        sortColors();
    }
    // endregion

    // region observers
    const observers: Map<string, ((data: IColorItem[]) => void)[]> = new Map<string, ((data: IColorItem[]) => void)[]>();

    function trigger(key: string) {
        if (observers.has(key)) {
            observers.get(key)?.map(cb => cb(gpColorStops));
        }
    }

    function on(key: string, cb: (data: IColorItem[]) => void) {
        if (!observers.has(key)) {
            observers.set(key, []);
        }
        observers.get(key)?.push(cb);
    }
    // endregion

    function setColors(colors: IColorItem[]): void {
        replaceColors(colors);
        render();
    }

    function setActive(index: number) {
        activeIndex = index;
        render();
    }

    function onPositionChanged(e: Event) {
        changePosition(parseFloat((e.target as HTMLInputElement).value), activeIndex);
        trigger(EVENTS.CHANGE);
        render();
    }

    function onColorAdded(e: Event) {
        const offsetX = (e as MouseEvent).offsetX;
        addColorStop(offsetX);
        trigger(EVENTS.CHANGE);
        const activeStopIndex = gpColorStops.findIndex((i: IColorItem) => i.position === getRelativeOffset((e.target as HTMLElement), offsetX));
        if (activeStopIndex > -1) {
            setActive(activeStopIndex);
        }
    }

    function onColorInputChange(e: Event) {
        changeColor((e.target as HTMLInputElement).value);
        trigger(EVENTS.CHANGE);
        render();
    }

    function onColorStopRemoved() {
        removeColorStop();
        setActive(0);
        trigger(EVENTS.CHANGE);
    }

    function onDragStart(elem: HTMLElement, index: number) {
        draggedStop = elem;
        setActive(index);
        trigger(EVENTS.DRAG_START);
        isBeingDragged = true;
    }

    function onBeingDragged(position: number) {
        if (!$stopsContainer) {
            return;
        }
        changePosition(
            getRelativeOffset($stopsContainer, position),
            draggedStop.dataset.index ? parseInt(draggedStop.dataset.index) : 0
        );
        trigger(EVENTS.CHANGE);
        renderGradients();
        renderLocationInput();
    }

    function onDragEnd() {
        isBeingDragged = false;
        trigger(EVENTS.DRAG_END);
    }

    function close() {
        hide();
    }

    // region render
    function renderGradients() {
        if (!$gradientScreen) {
            return;
        }
        ($gradientScreen as HTMLDivElement).style.background = getGradientString(gpColorStops);
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
        if ($positionInput) {
            ($positionInput as HTMLInputElement).value = gpColorStops[activeIndex].position;
        }
    }

    function renderColorInput() {
        if ($colorDivInput) {
            ($colorDivInput as any as HTMLInputElement).style.background = gpColorStops[activeIndex].color;
        }

    }

    function render() {
        renderStops();
        renderGradients();
        renderLocationInput();
        renderColorInput();
    }
    // endregion

    function createPopup() {
        const template = `<div class="${gpPrefix}header">Gradient Picker</div>
                          <div class="${gpPrefix}wrapper">
                              <div class="${gpPrefix}gradient-screen"></div>
                              <div class="${gpPrefix}stops-container"></div>
                              <div class="${gpPrefix}stop-info">
                                <span class="${gpPrefix}stops-title">Stops</span>
                                <div class="${gpPrefix}input-item">
                                    <label>Color:</label>
                                    <div class="${gpPrefix}color-div-input"></div>
                                </div>
                                <div class="${gpPrefix}input-item">
                                    <label for="location">Location:</label>
                                    <input type="number" min="0" max="100" class="${gpPrefix}location-input">
                                    <span>%</span>
                                </div>
                                <div class="${gpPrefix}input-item">
                                    <button type="button" class="${gpPrefix}delete-stop">Delete</button>
                                </div>
                              </div>                        
                          </div>
                          <div class="${gpPrefix}close"></div>`;
        const p = document.createElement('div');
        p.className = `${gpPrefix}container`;
        p.innerHTML = template;
        return p;
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
        dragElemInside(
            elem,
            $stopsContainer,
            () => onDragStart(elem, index),
            onBeingDragged,
            onDragEnd
        );
        elem.addEventListener('drag', (e) => e.preventDefault(), false);
        elem.addEventListener('dragstart', (e) => e.preventDefault(), false);
        elem.addEventListener('dragend', (e) => e.preventDefault(), false);

        return elem;
    }

    function show() {
        $popup.style.display = 'block';
    }

    function hide() {
        $popup.style.display = 'none';
    }

    function setActiveColor(color: string): void {
        changeColor(color);
        trigger(EVENTS.CHANGE);
        render();
    }

    function getInputElement(): HTMLElement | null {
        return $colorDivInput;
    }

    function getActiveColor(): string {
        return gpColorStops[activeIndex].color;
    }

    return {
        on: on,
        setActiveColor: setActiveColor,
        setColors: setColors,
        getInputElement: getInputElement,
        getActiveColor: getActiveColor,
        show: show,
        hide: hide
    }
}
