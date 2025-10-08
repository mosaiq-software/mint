import {type CanvasLayer, createLayer} from "./layer";
import {getSelectedDoc} from "./docs.svelte";

export function handleImageDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
        const file = files[0];
        const reader = new FileReader();

        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const layer = createLayer('canvas', file.name) as CanvasLayer;
                const layerX = event.offsetX - img.width / 2;
                const layerY = event.offsetY - img.height / 2;
                const translateMatrix = layer.transform.matrix.translate(layerX, layerY);
                layer.transform.matrix = translateMatrix;
                layer.canvas.width = img.width;
                layer.canvas.height = img.height;
                const ctx = layer.canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, img.width, img.height);
                const doc = getSelectedDoc();
                if (!doc) return;
                doc.layers.push(layer);
            };
            img.src = readerEvent.target?.result as string;
        };

        reader.readAsDataURL(file);
    }
}