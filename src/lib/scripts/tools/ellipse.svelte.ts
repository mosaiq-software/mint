import type { Tool } from '.';
import { getSelectedEllipseLayer } from './utils/shape.svelte';

const ellipse = $state({
    dragging: false
});

const selected = $derived.by(getSelectedEllipseLayer);

export const ellipseTool: Tool = {
    name: 'ellipse',
    onPointerDown: (data) => {},
    onPointerMove: (data) => {},
    onPointerUp: (data) => {},
};

export default ellipse;