import type { Tool } from '.';
import docs from '../docs.svelte';
import ui from '../ui.svelte';
import { createLayer, type LayerID, type TextProperties } from '../layer';
import { focusAndSelect } from '../../components/overlays/TextEdit.svelte';
import { postAction } from '../action';

const resizeHitboxSize = 5;

/**
 * Text tool state, including a list of text measure elements,
 * current text properties, dragging state, and current action.
 */
const text = $state({
    elements: {} as Record<LayerID, HTMLDivElement>,
    properties: {
        fontFamily: 'Arial',
        fontSize: 24,
        lineHeight: 1.2,
        bold: false,
        italic: false,
        underline: false
    } as TextProperties,
    dragging: false,
    action: "none" as "none" | "resize" | "edit",
});

/** Retrieves the currently selected text layer, or null if none or multiple are selected. */
export function getSelectedTextLayer() {
    return (ui.selectedLayers.length == 1 && ui.selectedLayers[0].type == 'text')
        ? ui.selectedLayers[0] : null;
}

/**
 * The text tool implementation. Creates new text layers on pointer down,
 * and handles resizing of existing text layers.
 */
export const textTool: Tool = {
    name: 'text',
    onPointerDown: (data) => {
        text.dragging = true;

        if (!docs.selected) return;

        // check if a text layer is already selected
        const selectedTextLayer = getSelectedTextLayer();
        if (!selectedTextLayer) {
            // create a new text layer
            const layer = createLayer('text', 'Text');
            layer.transform.matrix = new DOMMatrix().translate(data.c.x, data.c.y);
            docs.selected.layers.push(layer);
            if (ui.selected) ui.selected.selectedLayers = [layer.id];

            postAction({
                type: "create",
                layer,
                position: docs.selected.layers.length - 1
            });

            // wait a short delay to ensure the layer is in the DOM
            setTimeout(focusAndSelect, 50);
        }
    },
    onPointerMove: (data) => {
        if (!data.l) return;

        const layer = getSelectedTextLayer();
        if (!layer) return;

        if (text.dragging) {
            if (text.action === "resize") {
                layer.width = Math.max(20, data.l.x);
                layer.height = Math.max(20, data.l.y);
            }
        } else {
            // determine if cursor is near the bottom right corner for resizing
            let point = new DOMPoint(layer.width, layer.height);
            point = layer.transform.matrix.transformPoint(point);
            const zoom = ui.selected?.zoom ?? 1;
            point.x *= zoom;
            point.y *= zoom;

            const dx = data.v.x - point.x;
            const dy = data.v.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= resizeHitboxSize) {
                text.action = "resize";
            } else if (
                data.l.x < layer.width &&
                data.l.y < layer.height &&
                data.l.x > 0 &&
                data.l.y > 0
            ) {
                text.action = "edit";
            } else {
                text.action = "none";
            }
        }
    },
    onPointerUp: () => {
        text.dragging = false;

        const layer = getSelectedTextLayer();
        if (layer && text.action === "resize") {
            if (!docs.selected) return;
            postAction({
                type: "update",
                layerID: layer.id,
                newLayer: { width: layer.width, height: layer.height },
            });
        }
    }
}

export default text;