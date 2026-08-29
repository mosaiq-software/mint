import type { Tool } from ".";
import { getSelectedRectangleLayer } from "./utils/shape.svelte";
import { createLayer } from "../layer";
import type { Point } from ".";
import docs from "../docs.svelte";
import ui from "../ui.svelte";
import { postAction } from "../action";

/** Rectangle tool state */
const rectangle = $state({
    dragging: false,
    action: "create" as "create" | "corner" | "stroke",
});

const p = {
    initial: { x: 0, y: 0 } as Point,
};

let selectedRectangleLayer = $derived.by(getSelectedRectangleLayer);

/** The rectangle tool implementation. Creates new rectangle layers on drag. */
export const rectangleTool: Tool = {
    name: "rectangle",
    onPointerDown: (data) => {
        rectangle.dragging = true;
        if (rectangle.action === "create") {
            p.initial = { ...data.c };
            if (ui.selected) ui.selected.selectedLayers = [];
        } else {
            rectangle.action = "create";
        }
    },
    onPointerMove: (data) => {
        if (rectangle.dragging) {
            if (rectangle.action === "create") {
                if (p.initial === null) return;

                const dx = data.c.x - p.initial.x;
                const dy = data.c.y - p.initial.y;
                const width = Math.abs(dx);
                const height = Math.abs(dy);

                if (!selectedRectangleLayer && width > 0 && height > 0) {
                    if (!docs.selected || !ui.selected) return;
                    const newLayer = createLayer("rectangle", "Rectangle");
                    docs.selected.layers.push(newLayer);
                    ui.selected.selectedLayers = [newLayer.id];
                }

                if (selectedRectangleLayer) {
                    selectedRectangleLayer.width = width;
                    selectedRectangleLayer.height = height;
                    selectedRectangleLayer.transform.matrix.e =
                        dx < 0 ? data.c.x : p.initial.x;
                    selectedRectangleLayer.transform.matrix.f =
                        dy < 0 ? data.c.y : p.initial.y;
                }
            }
        } else {
            rectangle.action = "create";
        }
    },
    onPointerUp: () => {
        rectangle.dragging = false;

        if (rectangle.action === "create" && selectedRectangleLayer) {
            ui.mode = "select";

            postAction({
                type: "create",
                layer: selectedRectangleLayer!,
                position: docs.selected!.layers.length - 1,
            });
        }
    },
};

export default rectangle;
