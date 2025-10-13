import {type CanvasLayer, createLayer, translateLayerBy} from "./layer";
import docs, {type DocumentID, getSelectedDoc} from "./docs.svelte";
import ui from "./ui.svelte";

export function handleImageDrop(event: DragEvent, marginSide: string = '') {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
        const file = files[0];
        const reader = new FileReader();

        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const layer = createLayer('canvas', file.name) as CanvasLayer;
                const doc = getSelectedDoc();
                if (!doc) return;

                switch (marginSide) {
                    case 'left': {
                        const scale = layer.canvas.height / img.height;
                        layer.transform.matrix = layer.transform.matrix.scale(scale, scale);
                        const imgWidth = Math.floor(img.width * scale);
                        doc.width += imgWidth;
                        doc.layers.forEach(oldLayer => {
                            translateLayerBy(oldLayer, imgWidth, 0);
                        });
                        break;
                    }
                    case 'top': {
                        const scale = layer.canvas.width / img.width;
                        layer.transform.matrix = layer.transform.matrix.scale(scale, scale);
                        const imgHeight = Math.floor(img.height * scale);
                        doc.height += imgHeight;
                        doc.layers.forEach(oldLayer => {
                            translateLayerBy(oldLayer, 0, imgHeight);
                        });
                        break;
                    }
                    case 'right': {
                        const scale = layer.canvas.height / img.height;
                        layer.transform.matrix = layer.transform.matrix.translate(doc.width, 0).scale(scale, scale);
                        doc.width += Math.floor(img.width * scale);
                        break;
                    }
                    case 'bottom': {
                        const scale = layer.canvas.width / img.width;
                        layer.transform.matrix = layer.transform.matrix.translate(0, doc.height).scale(scale, scale);
                        doc.height += Math.floor(img.height * scale);
                        break;
                    }
                    default: {
                        const layerX = event.offsetX - img.width / 2;
                        const layerY = event.offsetY - img.height / 2;
                        layer.transform.matrix = layer.transform.matrix.translate(layerX, layerY);
                        break;
                    }
                }

                layer.canvas.width = img.width;
                layer.canvas.height = img.height;
                const ctx = layer.canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, img.width, img.height);
                doc.layers.push(layer);
            };
            img.src = readerEvent.target?.result as string;
        };

        reader.readAsDataURL(file);
    }
}

export function importImageAsNewDoc(file: File, onSuccess: () => void = () => {}) {
    const id = 'document-' + crypto.randomUUID() as DocumentID;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {

            docs[id] = {
                id,
                name: file.name,
                width: img.width, 
                height: img.height,
                layers: []
            };

            ui.selectedDocument = id;
            ui.selectedLayers[id] = [];

            const layer = createLayer('canvas', file.name) as CanvasLayer;
            layer.canvas.width = img.width;
            layer.canvas.height = img.height;
            const ctx = layer.canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, img.width, img.height);

            docs[id].layers.push(layer);

            onSuccess();

        }
        img.src = readerEvent.target?.result as string;
    }
    reader.readAsDataURL(file);
}