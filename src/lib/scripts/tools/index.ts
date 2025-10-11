import type { Mode } from '../ui.svelte';
import select, { selectTool } from './select.svelte';
import draw, { drawTool } from './draw.svelte';
import erase, { eraseTool } from './erase.svelte';
import text, { textTool } from './text.svelte';


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
    onKeyUp?: (e: KeyboardEvent) => void;
}

export const tools: Record<Mode, Tool> = {
    select: selectTool, draw: drawTool, erase: eraseTool, text: textTool
};

export { draw, select, erase, text }