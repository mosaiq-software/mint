import {type CanvasLayer, createLayer} from "./layer";
import {getSelectedDoc} from "./docs.svelte";

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

                let imgWidth = 0, imgHeight = 0;

                switch (marginSide) {
                    case 'left': {
                        imgHeight = layer.canvas.height;
                        imgWidth = img.width * (layer.canvas.height / img.height);
                        doc.width += imgWidth;
                        doc.layers.forEach(oldLayer => {
                            oldLayer.transform.matrix = oldLayer.transform.matrix.translate(imgWidth, 0);
                        });
                        break;
                    }
                    case 'top': {
                        imgWidth = layer.canvas.width;
                        imgHeight = img.height * (layer.canvas.width / img.width);
                        doc.height += imgHeight;
                        doc.layers.forEach(oldLayer => {
                            oldLayer.transform.matrix = oldLayer.transform.matrix.translate(0, imgHeight);
                        });
                        break;
                    }
                    case 'right': {
                        imgHeight = layer.canvas.height;
                        imgWidth = img.width * (layer.canvas.height / img.height);
                        layer.transform.matrix = layer.transform.matrix.translate(doc.width, 0);
                        doc.width += imgWidth;
                        break;
                    }
                    case 'bottom': {
                        imgWidth = layer.canvas.width;
                        imgHeight = img.height * (layer.canvas.width / img.width);
                        layer.transform.matrix = layer.transform.matrix.translate(0, doc.height);
                        doc.height += imgHeight;
                        break;
                    }
                    default: {
                        imgWidth = img.width;
                        imgHeight = img.height;
                        const layerX = event.offsetX - imgWidth / 2;
                        const layerY = event.offsetY - imgHeight / 2;
                        const translateMatrix = layer.transform.matrix.translate(layerX, layerY);
                        layer.transform.matrix = translateMatrix;
                        break;
                    }
                }

                layer.canvas.width = imgWidth;
                layer.canvas.height = imgHeight;
                const ctx = layer.canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, imgWidth, imgHeight);
                doc.layers.push(layer);
            };
            img.src = readerEvent.target?.result as string;
        };

        reader.readAsDataURL(file);
    }
}