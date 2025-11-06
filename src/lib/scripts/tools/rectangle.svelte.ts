import type { PointerEventData, Tool } from '.';
import { getSelectedRectangleLayer } from './utils/shape.svelte';
import { createLayer } from '../layer';
import type { Point } from '.';
import docs from '../docs.svelte';
import ui from '../ui.svelte';
import { postAction } from '../action';

const rectangle = $state({
    dragging: false,
    action: 'none' as 'none' | 'create' | 'corner' | 'stroke'
});

const p = {
    initial: { x: 0, y: 0 } as Point,
};

let selected = $derived.by(getSelectedRectangleLayer);

export const rectangleTool: Tool = {
    name: 'rectangle',
    onPointerDown: (data) => {
        rectangle.dragging = true;
        if (rectangle.action === 'create') {
            p.initial = {...data.c};
            if (ui.selected) ui.selected.selectedLayers = [];
        } else {
            setAction(data);
        }
    },
    onPointerMove: (data) => {
        if (rectangle.dragging) {
            if (rectangle.action === 'create') {
                if (p.initial === null) return;

                const dx = data.c.x - p.initial.x;
                const dy = data.c.y - p.initial.y;
                const width = Math.abs(dx);
                const height = Math.abs(dy);

                if (!selected && width > 0 && height > 0) {
                    // create new rectangle layer and select it
                    if (!docs.selected || !ui.selected) return;
                    const newLayer = createLayer('rectangle', 'New Rectangle');
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
        rectangle.dragging = false;

        if (rectangle.action === 'create' && selected) {
            ui.mode = 'select';
            rectangle.action = 'none';

            postAction({
                type: 'create',
                layer: selected!,
                position: docs.selected!.layers.length - 1
            });
        }
    },
};

function setAction(_data: PointerEventData) {
    rectangle.action = 'create';
}

export default rectangle;