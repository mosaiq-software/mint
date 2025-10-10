import type { Tool } from ".";

const erase = $state({});
export const eraseTool: Tool = {
    name: 'erase',
    onPointerDown: (data) => {
        console.log("Erase tool mouse down at", data.l);
    },
    onPointerMove: (data) => {
        console.log("Erase tool mouse move at", data.l);
    },
    onPointerUp: (data) => {
        console.log("Erase tool mouse up at", data.l);
    }   
}

export default erase;