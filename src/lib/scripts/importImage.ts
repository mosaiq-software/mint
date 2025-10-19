import { type CanvasLayer, createLayer, translateLayerBy } from "./layer";
import docs, { createDocument } from "./docs.svelte";
import {postAction, type PostAction} from "./action";

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
                if (!docs.selected) return;

                switch (marginSide) {
                    case 'left': {
                        const scale = layer.canvas.height / img.height;
                        layer.transform.matrix = layer.transform.matrix.scale(scale, scale);
                        const imgWidth = Math.floor(img.width * scale);
                        const actions: PostAction[] = [];
                        actions.push({
                            type: 'document',
                            oldDocument: {id: docs.selected.id, width: docs.selected.width},
                            newDocument: {id: docs.selected.id, width: docs.selected.width + imgWidth}
                        });
                        docs.selected.layers.forEach(oldLayer => {
                            translateLayerBy(oldLayer, imgWidth, 0);
                            actions.push({
                                type: 'transform',
                                layerID: oldLayer.id,
                                newMatrix: oldLayer.transform.matrix
                            });
                        });
                        actions.push({
                            type: 'create',
                            layer,
                            position: docs.selected.layers.length
                        });
                        postAction({
                            type: 'compound',
                            actions
                        });
                        docs.selected.width = docs.selected.width + imgWidth;
                        break;
                    }
                    case 'top': {
                        const scale = layer.canvas.width / img.width;
                        layer.transform.matrix = layer.transform.matrix.scale(scale, scale);
                        const imgHeight = Math.floor(img.height * scale);
                        const actions: PostAction[] = [];
                        actions.push({
                            type: 'document',
                            oldDocument: {id: docs.selected.id, height: docs.selected.height},
                            newDocument: {id: docs.selected.id, height: docs.selected.height + imgHeight}
                        });
                        docs.selected.layers.forEach(oldLayer => {
                            translateLayerBy(oldLayer, 0, imgHeight);
                            actions.push({
                                type: 'transform',
                                layerID: oldLayer.id,
                                newMatrix: oldLayer.transform.matrix
                            });
                        });
                        actions.push({
                            type: 'create',
                            layer,
                            position: docs.selected.layers.length
                        });
                        postAction({
                            type: 'compound',
                            actions
                        });
                        docs.selected.height = docs.selected.height + imgHeight;
                        break;
                    }
                    case 'right': {
                        const scale = layer.canvas.height / img.height;
                        layer.transform.matrix = layer.transform.matrix.translate(docs.selected.width, 0).scale(scale, scale);
                        const widthDiff = Math.floor(img.width * scale);
                        postAction({
                            type: 'compound',
                            actions: [
                                {
                                    type: 'document',
                                    oldDocument: {id: docs.selected.id, width: docs.selected.width},
                                    newDocument: {id: docs.selected.id, width: docs.selected.width + widthDiff}
                                },
                                {
                                    type: 'create',
                                    layer,
                                    position: docs.selected.layers.length
                                }
                            ]
                        });
                        docs.selected.width = docs.selected.width + widthDiff;
                        break;
                    }
                    case 'bottom': {
                        const scale = layer.canvas.width / img.width;
                        layer.transform.matrix = layer.transform.matrix.translate(0, docs.selected.height).scale(scale, scale);
                        const heightDiff = Math.floor(img.height * scale);
                        postAction({
                            type: 'compound',
                            actions: [
                                {
                                    type: 'document',
                                    oldDocument: {id: docs.selected.id, height: docs.selected.height},
                                    newDocument: {id: docs.selected.id, height: docs.selected.height + heightDiff}
                                },
                                {
                                    type: 'create',
                                    layer,
                                    position: docs.selected.layers.length
                                }
                            ]
                        });
                        docs.selected.height = docs.selected.height + heightDiff;
                        break;
                    }
                    default: {
                        const layerX = event.offsetX - img.width / 2;
                        const layerY = event.offsetY - img.height / 2;
                        layer.transform.matrix = layer.transform.matrix.translate(layerX, layerY);
                        postAction({
                            type: 'create',
                            layer,
                            position: docs.selected.layers.length
                        });
                        break;
                    }
                }

                layer.canvas.width = img.width;
                layer.canvas.height = img.height;
                const ctx = layer.canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, img.width, img.height);
                docs.selected.layers.push(layer);
            };
            img.src = readerEvent.target?.result as string;
        };

        reader.readAsDataURL(file);
    }
}

export function importImageAsNewDoc(file: File, onSuccess: () => void = () => {}) {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
            if (img.width === 0 || img.height === 0) {
                console.error("Failed to load image");
                return;
            }

            const id = createDocument(file.name, img.width, img.height);

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