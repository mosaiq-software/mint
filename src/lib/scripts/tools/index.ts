import type { Mode } from '../ui.svelte';
import select, { selectTool } from './select.svelte';
import draw, { drawTool } from './draw.svelte';
import erase, { eraseTool } from './erase.svelte';
import text, { textTool } from './text.svelte';
import rectangle, { rectangleTool } from './rectangle.svelte';
import ellipse, { ellipseTool } from './ellipse.svelte';
import { fillTool } from './fill.svelte';

/** A 2D point with x and y coordinates. */
export interface Point {
    x: number;
    y: number;
}

/**
 * Data provided to tool pointer event handlers.
 * v: Viewport coordinates, unadjusted by scale (relative to the canvas top-left)
 * c: Canvas coordinates (relative to the document canvas top-left)
 * l: Layer coordinates (relative to the target layer top-left), or null if not applicable
 * e: The original MouseEvent
 */
export interface PointerEventData {
    v: Point;
    c: Point;
    l: Point | null;
    e: MouseEvent;
}

/** A tool implementation with event handlers for pointer and keyboard events. */
export interface Tool {
    name: Mode;
    onPointerDown?: (data: PointerEventData) => void;
    onPointerMove?: (data: PointerEventData) => void;
    onPointerUp?: (data: PointerEventData) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
}

/** A record mapping tool modes to their implementations. */
export const tools: Record<Mode, Tool> = {
    select: selectTool, draw: drawTool,
    erase: eraseTool, text: textTool,
    rectangle: rectangleTool, ellipse: ellipseTool,
    fill: fillTool,
};

export { draw, select, erase, text, rectangle, ellipse };