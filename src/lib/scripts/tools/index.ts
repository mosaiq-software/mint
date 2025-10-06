import type { Mode } from '../ui.svelte';
import select from './select.svelte';
import draw, { drawState } from './draw.svelte';
import erase from './erase.svelte';


export interface Point {
    x: number;
    y: number;
}

export interface PointerEventData {
    c: Point;
    l: Point | null;
    e: MouseEvent;
}

export interface Tool {
    name: Mode;
    onPointerDown?: (data: PointerEventData) => void;
    onPointerMove?: (data: PointerEventData) => void;
    onPointerUp?: (data: PointerEventData) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
}

export const tools: Record<Mode, Tool> = {
    select, draw, erase
};

export {
    drawState as draw
}