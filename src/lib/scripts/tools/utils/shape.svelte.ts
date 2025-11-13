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
    if (ui.selectedLayers.length !== 1) return null;
    if (ui.selectedLayers[0].type !== type) return null;
    return ui.selectedLayers[0] as RectangleLayer | EllipseLayer;
}
export function getSelectedRectangleLayer(): RectangleLayer | null {
    return getSelectedShapeLayer('rectangle') as RectangleLayer | null;
}
export function getSelectedEllipseLayer(): EllipseLayer | null {
    return getSelectedShapeLayer('ellipse') as EllipseLayer | null;
}