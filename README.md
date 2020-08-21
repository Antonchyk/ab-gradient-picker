# ab-gradient-picker

Simple gradient picker, with no dependencies.

## Download

Install `npm i ab-gradient-picker`





## Usage

```ts
    const gp = createGradientPicker({
            initColors: [
                {
                    color: '#000000',
                    position: 0        
                },
                {
                    color: '#ffffff',
                    position: 100        
                }
            ]       
    });

    // Do stuff on change of the gradient
    gp.on('change', colors => {
        console.log(colors);
    })
```





# Configurations

* `initColor` - array of colors and positions
* `zIndex` - zIndex of popup(default: 999)
* `isCustomColorPicker` - if custom color picker will be used, by default native browser one is used 




## Add custom color picker

ab-gradient-picker color picker is independent and uses the browser's native one by default, just to make it more accessible, but you can easily switch it with one of your choices (recommended as not all browsers support properly `input[type=color]`).

In the example below we use [a-color-picker](https://narsenico.github.io/a-color-picker/) just as the proof of concept

```ts
import {createGradientPicker, IGradientPickerConfig} from 'ab-gradient-picker';
import * as AColorPicker from 'a-color-picker';
import {ACPController} from "a-color-picker";

const config: IGradientPickerConfig = {
    initColors: [
        {
            color: '#000000',
            position: 0,
        },
        {
            color: '#ffffff',
            position: 100,
        }
    ],
    zIndex: 1001,
    isCustomColorPicker: true
}

const gp = createGradientPicker(config);
gp.on('change', v => console.log('change', v));
gp.on('drag:start', v => console.log('drag:start', v));
gp.on('drag:end', v => console.log('drag:end', v));
const colorInput = gp.getInputElement();
colorInput.addEventListener('click', (e) => {
    const picker = AColorPicker.createPicker(colorInput, {color: gp.getActiveColor()});
    picker.on('change', (p: ACPController, color) => {
        gp.setActiveColor(color);
    });
    picker.element.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('click', (e) => {
        if (e.target !== colorInput && picker.element?.parentNode) {
            picker.element.parentNode.removeChild(picker.element);
        }
    });
    e.preventDefault();
})


```


## Events

Available events

* `change` - Gradient is changed
* `drag:start` - Started dragging the handler
* `drag:end` - Stopped dragging the handler

## API

Methods

* `setActiveColor(color: string)` - Change active color
* `getInputElement():HTMLElement | null` - get color input element to override its behaviour. If isCustomColorPicker set to true there is just div with background color. 
* `setActiveColor(color: string)` - set color for active color stop

## License

MIT
