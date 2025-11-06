import type { PointerEventData, Tool } from '.';
import { getSelectedEllipseLayer } from './utils/shape.svelte';
import { createLayer } from '../layer';
import type { Point } from '.';
import docs from '../docs.svelte';
import ui from '../ui.svelte';
import { postAction } from '../action';

const ellipse = $state({
    dragging: false,
    action: 'none' as 'none' | 'create' | 'stroke'
});

const p = {
    initial: { x: 0, y: 0 } as Point,
};

let selected = $derived.by(getSelectedEllipseLayer);

export const ellipseTool: Tool = {
    name: 'ellipse',
    onPointerDown: (data) => {
        ellipse.dragging = true;
        if (ellipse.action === 'create') {
            p.initial = {...data.c};
            if (ui.selected) ui.selected.selectedLayers = [];
        } else {
            setAction(data);
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

                if (!selected && width > 0 && height > 0) {
                    // create new ellipse layer and select it
                    if (!docs.selected || !ui.selected) return;
                    const newLayer = createLayer('ellipse', 'New Ellipse');
                    docs.selected.layers.push(newLayer);
                    ui.selected.selectedLayers = [ newLayer.id ];
                }

                if (selected) {
                    selected.width = width;
                    selected.height = height;
                    selected.transform.matrix.e = dx < 0 ? data.c.x : p.initial.x;
                    selected.transform.matrix.f = dy < 0 ? data.c.y : p.initial.y;
                }
            }
        } else {
            setAction(data);
        }
    },
    onPointerUp: (data) => {
        ellipse.dragging = false;

        if (ellipse.action === 'create' && selected) {
            ui.mode = 'select';
            ellipse.action = 'none';

            postAction({
                type: 'create',
                layer: selected!,
                position: docs.selected!.layers.length - 1
            });
        }
    },
};

function setAction(_data: PointerEventData) {
    ellipse.action = 'create';
}

export default ellipse;