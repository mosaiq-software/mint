import type { Point } from "..";
import type { Layer, LayerID } from "../../layer";

/**
 * Traverses layers from top to bottom to find the first shape under the given point.
 * @returns The found layer's id and the point in that layer's local space, or null if none found.
 */
export function findLayerAtPoint(
    layers: Layer[],
    point: Point,
): { id: LayerID; local: Point } | null {
    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.visible) continue;

        if (layer.type === "canvas") {
            // sample canvas pixel at point, transformed to layer space
            const ctx = layer.canvas.getContext("2d");
            if (!ctx) continue;

            const invMatrix = layer.transform.matrix.inverse();
            const local = new DOMPoint(point.x, point.y).matrixTransform(
                invMatrix,
            );
            const pixel = ctx.getImageData(local.x, local.y, 1, 1).data;

            // if pixel is not transparent, this layer is hit
            if (pixel[3] > 0) {
                return { id: layer.id, local: { x: local.x, y: local.y } };
            }
        } else if (
            layer.type === "text" ||
            layer.type === "rectangle" ||
            layer.type === "ellipse"
        ) {
            // convert point to layer space
            const invMatrix = layer.transform.matrix.inverse();
            const local = new DOMPoint(point.x, point.y).matrixTransform(
                invMatrix,
            );

            // check if point is within the layer's bounding box
            if (
                local.x >= 0 &&
                local.x <= layer.width &&
                local.y >= 0 &&
                local.y <= layer.height
            ) {
                return { id: layer.id, local: { x: local.x, y: local.y } };
            }
        }
    }

    return null;
}

/**
 * Determines the new layer selection resulting from a click, toggling the
 * clicked layer if shift is held, replacing the selection otherwise, and
 * clearing it if nothing was clicked (unless shift is held).
 * @param found The id of the layer hit by the click, or null if none.
 * @param selectedLayers The currently selected layer ids.
 * @param shiftKey Whether shift was held during the click.
 * @returns The updated selection.
 */
export function updateSelectionForClick(
    found: LayerID | null,
    selectedLayers: LayerID[],
    shiftKey: boolean,
): LayerID[] {
    if (found) {
        if (!shiftKey) return [found];
        return selectedLayers.includes(found)
            ? selectedLayers.filter((id) => id !== found)
            : [...selectedLayers, found];
    }

    return shiftKey ? selectedLayers : [];
}
