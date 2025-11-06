import type { Point } from "..";
import docs from "../../docs.svelte";
import type { EllipseLayer, RectangleLayer } from "../../layer";
import ui from "../../ui.svelte";

export const shape = $state({
    strokeWidth: 2,
    strokeAlign: 'center' as 'center' | 'inside' | 'outside',
    cornerRadius: 0,
});

function getSelectedShapeLayer(
    type: 'rectangle' | 'ellipse'
): RectangleLayer | EllipseLayer | null {
    if (!docs.selected || !ui.selected) return null;
    const selectedLayers = docs.selected.layers.filter(
        layer => (layer.type === type) && ui.selected!.selectedLayers.includes(layer.id)
    );

    if (selectedLayers.length !== 1) return null;
    if (selectedLayers[0].type !== type) return null;
    return selectedLayers[0] as RectangleLayer | EllipseLayer;
}
export function getSelectedRectangleLayer(): RectangleLayer | null {
    return getSelectedShapeLayer('rectangle') as RectangleLayer | null;
}
export function getSelectedEllipseLayer(): EllipseLayer | null {
    return getSelectedShapeLayer('ellipse') as EllipseLayer | null;
}