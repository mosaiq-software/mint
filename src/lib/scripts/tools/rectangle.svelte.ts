import type { Tool } from '.';
import { getSelectedRectangleLayer } from './utils/shape.svelte';

const rectangle = $state({
    dragging: false
});

const selected = $derived.by(getSelectedRectangleLayer);

export const rectangleTool: Tool = {
    name: 'rectangle',
    onPointerDown: (data) => {},
    onPointerMove: (data) => {},
    onPointerUp: (data) => {},
};

export default rectangle;