import type { Tool } from '.';
import { getSelectedDoc } from '../docs.svelte';
import ui from '../ui.svelte';
import { createLayer, type LayerID, type TextProperties } from '../layer';

const text = $state({
    elements: {} as Record<LayerID, HTMLDivElement>,
    properties: {
        fontFamily: 'Arial',
        fontSize: 24,
        lineHeight: 1.2,
        bold: false,
        italic: false,
        underline: false
    } as TextProperties
});

export function getSelectedTextLayer() {
    const doc = getSelectedDoc();
    if (!doc) return null;

    const selectedLayerIds = ui.selectedLayers[doc.id]
    if (selectedLayerIds.length !== 1) return null;
    const selectedLayerId = selectedLayerIds[0];

    const layer = doc.layers.find(l => l.id === selectedLayerId);
    if (layer?.type !== 'text') return null;
    
    return layer;
}

export const textTool: Tool = {
    name: 'text',
    onPointerDown: (data) => {
        if (data.l) return;
        
        const doc = getSelectedDoc();
        if (!doc) return;

        // create a new text layer
        const layer = createLayer('text', 'Text');
        doc.layers.push(layer);
        ui.selectedLayers[doc.id] = [layer.id];
    }
}

export default text;