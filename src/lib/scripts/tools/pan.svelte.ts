import type { Tool, Point } from "./index";
import ui from "../ui.svelte";
import docs from "../docs.svelte";

/** Pan tool state */
const pan = $state({
    isPanning: false,
});

let initial: Point | null = null;

/**
 * The pan tool implementation. Allows the user to pan
 * around the canvas by clicking and dragging.
 */
export const panTool: Tool = {
    name: "pan",
    onPointerDown: (data) => {
        if (data.e.button == 0 || data.e.buttons == 1) {
            pan.isPanning = true;
            initial = { x: data.v.x, y: data.v.y };
        }
    },
    onPointerMove: (data) => {
        if (!pan.isPanning || !initial || !ui.selected || !docs.selected)
            return;

        const dx = data.v.x - initial.x;
        const dy = data.v.y - initial.y;
        const width = docs.selected.width * ui.selected.zoom + 56;
        const height = docs.selected.height * ui.selected.zoom + 56;

        let newX = ui.selected.pan.x - dx;
        let newY = ui.selected.pan.y - dy;

        const clampedX = Math.max(0, Math.min(newX, width));
        const clampedY = Math.max(0, Math.min(newY, height));

        ui.selected.pan.x = clampedX;
        ui.selected.pan.y = clampedY;

        initial.x += clampedX - newX;
        initial.y += clampedY - newY;
    },
    onPointerUp: (data) => {
        pan.isPanning = false;
        initial = null;
    },
};

export default pan;
