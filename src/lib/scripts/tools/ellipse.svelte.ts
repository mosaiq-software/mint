import type { Tool } from '.';
import { getSelectedEllipseLayer } from './utils/shape.svelte';
import { createLayer } from '../layer';
import type { Point } from '.';
import docs from '../docs.svelte';
import ui from '../ui.svelte';
import { postAction } from '../action';

/** Ellipse tool state */
const ellipse = $state({
    dragging: false,
    action: 'none' as 'none' | 'create' | 'stroke'
});

const p = {
    initial: { x: 0, y: 0 } as Point,
};

let selectedEllipseLayer = $derived.by(getSelectedEllipseLayer);

/** The ellipse tool implementation. Creates new ellipse layers on drag. */
export const ellipseTool: Tool = {
    name: 'ellipse',
    onPointerDown: (data) => {
        ellipse.dragging = true;
        if (ellipse.action === 'create') {
            p.initial = {...data.c};
            if (ui.selected) ui.selected.selectedLayers = [];
        } else {
            ellipse.action = 'create';
        }
    },
    onPointerMove: (data) => {
        if (ellipse.dragging) {
            if (ellipse.action === 'create') {
                if (p.initial === null) return;

                const dx = data.c.x - p.initial.x;
                const dy = data.c.y - p.initial.y;
                const width = Math.abs(dx);
                const height = Math.abs(dy);

                if (!selectedEllipseLayer && width > 0 && height > 0) {
                    if (!docs.selected || !ui.selected) return;
                    const newLayer = createLayer('ellipse', 'New Ellipse');
                    docs.selected.layers.push(newLayer);
                    ui.selected.selectedLayers = [ newLayer.id ];
                }

                if (selectedEllipseLayer) {
                    selectedEllipseLayer.width = width;
                    selectedEllipseLayer.height = height;
                    selectedEllipseLayer.transform.matrix.e = dx < 0 ? data.c.x : p.initial.x;
                    selectedEllipseLayer.transform.matrix.f = dy < 0 ? data.c.y : p.initial.y;
                }
            }
        } else {
            ellipse.action = 'create';
        }
    },
    onPointerUp: () => {
        ellipse.dragging = false;

        if (ellipse.action === 'create' && selectedEllipseLayer) {
            ui.mode = 'select';
            ellipse.action = 'none';

            postAction({
                type: 'create',
                layer: selectedEllipseLayer!,
                position: docs.selected!.layers.length - 1
            });
        }
    },
};

export default ellipse;