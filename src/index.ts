import {gradientPicker} from "./GradientPicker";

const gp = gradientPicker([
    {
        color: '#000',
        position: 0,
    },
    {
        color: '#fff',
        position: 100,
    }
]);

gp.onChange((data) => console.log(data));
