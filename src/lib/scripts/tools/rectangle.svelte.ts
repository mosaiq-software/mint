import type { Tool } from '.';
import { getSelectedRectangleLayer } from './utils/shape.svelte';
import { createLayer } from '../layer';
import type { Point } from '.';
import docs from '../docs.svelte';
import ui from '../ui.svelte';

const rectangle = $state({
    dragging: false,
    action: 'none' as 'none' | 'create' | 'corner' | 'stroke'
});

const p = {
    initial: { x: 0, y: 0 } as Point,
};

const selected = $derived.by(getSelectedRectangleLayer);

export const rectangleTool: Tool = {
    name: 'rectangle',
    onPointerDown: (data) => {
        rectangle.dragging = true;
        if (rectangle.action === 'create') {
            p.initial = {...data.c};

            // create new rectangle layer and select it
            if (!docs.selected || !ui.selected) return;
            const newLayer = createLayer('rectangle', 'New Rectangle');
            docs.selected.layers.push(newLayer);
            ui.selected.selectedLayers = [ newLayer.id ];
        } else {
            setAction();
        }
    },
    onPointerMove: (data) => {
        if (rectangle.dragging) {
            if (rectangle.action === 'create') {
                if (!selected) return;
                const dx = data.c.x - p.initial.x;
                const dy = data.c.y - p.initial.y;

                selected.width = Math.abs(Math.abs(dx));
                selected.height = Math.abs(Math.abs(dy));
                selected.transform.matrix.e = dx < 0 ? data.c.x : p.initial.x;
                selected.transform.matrix.f = dy < 0 ? data.c.y : p.initial.y;
            }
        } else {
            setAction();
        }
    },
    onPointerUp: (data) => {
        rectangle.dragging = false;

        if (rectangle.action === 'create') {
            ui.mode = 'select';
            rectangle.action = 'none';
        }
    },
};

function setAction() {
    if (selected) {
        rectangle.action = 'none';
    } else {
        rectangle.action = 'create';
    }
}

export default rectangle;