import type { Tool } from ".";

const select: Tool = {
    name: 'select',
    onMouseDown: (data) => {
        console.log("Select tool mouse down at", data.l);
    },
    onMouseMove: (data) => {
        console.log("Select tool mouse move at", data.l);
    },
    onMouseUp: (data) => {
        console.log("Select tool mouse up at", data.l);
    }   
}

export default select;