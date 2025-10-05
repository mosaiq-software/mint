import type { Tool } from ".";

const erase: Tool = {
    name: 'erase',
    onMouseDown: (data) => {
        console.log("Erase tool mouse down at", data.l);
    },
    onMouseMove: (data) => {
        console.log("Erase tool mouse move at", data.l);
    },
    onMouseUp: (data) => {
        console.log("Erase tool mouse up at", data.l);
    }   
}

export default erase;