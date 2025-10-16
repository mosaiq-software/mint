import {type Document, type DocumentID} from './docs.svelte';
import {render} from "./render";
import type {TextLayer, CanvasLayer} from "./layer";

enum DBs {
    METADATA = 'metadata',
    LAYERS = 'LAYERS',
    PREVIEWS = 'previews'
}

interface DatabaseTypes {
    [DBs.METADATA]: Document & {
        layers: (TextLayer | (Omit<CanvasLayer, "canvas"> & {
            canvasDimensions: {
                width: number
                height: number
            }
        }))[],
        lastModified: Date
    },
    [DBs.LAYERS]: Blob,
    [DBs.PREVIEWS]: Blob
}

function workOnDatabase(name: DBs, version: number = 1): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database?.objectStoreNames.contains(name)) {
                database.createObjectStore(name);
            }
        }

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);
    });
}

async function putInDB(name: DBs, key: IDBValidKey, value: any) {
    const db = await workOnDatabase(name);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(name, 'readwrite');
        const req = tx.objectStore(name).put($state.snapshot(value), key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getFromDB<type extends DBs>(name: DBs, key: IDBValidKey) {
    const db = await workOnDatabase(name);
    return new Promise<DatabaseTypes[type]>((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const req = tx.objectStore(name).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);        
    })
}

async function getSeveralFromDB<type extends DBs>(name: DBs, keys: string[]) {
    const db = await workOnDatabase(name);
    return new Promise<DatabaseTypes[type][]>((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const succeededs = Object.fromEntries(keys.map(key => [key, false]));
        const reqs = keys.map(key => {
            const req = tx.objectStore(name).get(key);
            req.onsuccess = () => {
                succeededs[key] = true;
                if (Object.values(succeededs).every(s => s)) {
                    resolve(reqs.map(r => r.result));
                }
            };
            req.onerror = () => reject(req.error);
            return req;
        });
    })
}

async function deleteFromDB(name: DBs, key: IDBValidKey) {
    const db = await workOnDatabase(name);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(name, 'readwrite');
        const req = tx.objectStore(name).delete(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getAllFromDB<type extends DBs>(name: DBs) {
    const db = await workOnDatabase(name);
    return new Promise<DatabaseTypes[type][]>((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const req = tx.objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    })
}

async function drawBlobOnOffscreenCanvas(blob: Blob, ctx: OffscreenCanvasRenderingContext2D) {
    return new Promise<null>((resolve, reject) => {

        const img = new Image();
        img.src = URL.createObjectURL(blob);

        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(img.src);
            resolve(null);
        }

    });
}

export const PREVIEW_MAX_SIZE = 64;

export function getPreviewSize(doc: Document) {
    const docOverPreviewSize = Math.floor(Math.max(doc.width, doc.height) / PREVIEW_MAX_SIZE);
    const pWidth = Math.floor(doc.width / docOverPreviewSize);
    const pHeight = Math.floor(doc.height / docOverPreviewSize);
    return {width: pWidth, height: pHeight};
}

async function getPreview(doc: Document) {
    const canvas = document.createElement('canvas');
    canvas.width = doc.width;
    canvas.height = doc.height;
    render(canvas, doc);
    const {width: pWidth, height: pHeight} = getPreviewSize(doc);
    const preview = new OffscreenCanvas(pWidth, pHeight);
    const ptx = preview.getContext('2d');
    if (!ptx) return new Blob();
    ptx.drawImage(canvas, 0, 0, pWidth, pHeight);
    return await preview.convertToBlob();
}

export async function saveDocumentToDB(document: Document) {
    const docId = document.id;

    const metadataP = putInDB(DBs.METADATA, docId, {
        ...document,
        layers: document.layers.map(l => {
            return {
                ...l,
                ...(
                    l.type === 'canvas'
                        ? {
                            canvas: undefined,
                            canvasDimensions: {
                                width: l.canvas.width,
                                height: l.canvas.height
                            }
                        }
                        : {}
                )
            };
        }),
        lastModified: Date.now()
    });

    const preview = await getPreview(document);
    const previewP = putInDB(DBs.PREVIEWS, docId, preview);
    const layerPs = document.layers.filter(layer => layer.type === 'canvas')
        .map(async layer => {
            const blob = await layer.canvas.convertToBlob();
            return putInDB(DBs.LAYERS, layer.id, blob);
        });

    await Promise.all([metadataP, previewP, ...layerPs]);

    return document;
}

// for an actual document -- metadata + layers
export async function getDocumentFromDB(docId: DocumentID) {
    const doc = await getFromDB<DBs.METADATA>(DBs.METADATA, docId);

    const canvasLayers = doc.layers.filter(l => l.type === 'canvas');

    const layerIDs = canvasLayers.map(l => l.id);
    const layers = await getSeveralFromDB<DBs.LAYERS>(DBs.LAYERS, layerIDs);

    const canvasBlobPs: Promise<null>[] = [];

    let canvasLayerIndex = 0;
    for (let i = 0; i < doc.layers.length; i++) {
        const l = doc.layers[i];
        const m = l.transform.matrix;
        l.transform.matrix = new DOMMatrix(
            [m.a, m.b, m.c, m.d, m.e, m.f]
        );
        if (l.type === 'canvas') {
            const {width, height} = l.canvasDimensions;
            const blob = layers[canvasLayerIndex];
            l.canvas = new OffscreenCanvas(width, height);
            const ctx = l.canvas.getContext('2d');
            if (ctx)
                canvasBlobPs.push(drawBlobOnOffscreenCanvas(blob, ctx));
            canvasLayerIndex++;
        }
    }

    await Promise.all(canvasBlobPs);

    return new Promise<Document>((resolve, reject) => {
        resolve(doc);
    });
}

// for document headers -- metadata + preview
export async function getDocumentsFromDB() {
    const docs = await getAllFromDB<DBs.METADATA>(DBs.METADATA);
    const previews = await getAllFromDB<DBs.PREVIEWS>(DBs.PREVIEWS);

    const fullDocPs = docs.map(async (d, index) => {
        const {width: pWidth, height: pHeight} = getPreviewSize(d);
        const blob = previews[index];
        const canvas = new OffscreenCanvas(pWidth, pHeight);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            await drawBlobOnOffscreenCanvas(blob, ctx);
        }
        return {...d, preview: canvas};
    });

    const fullDocs = await Promise.all(fullDocPs);

    return new Promise<(Document & {preview: OffscreenCanvas, lastModified: Date})[]>((resolve, reject) => {
        resolve(fullDocs);
    });
}

export async function deleteDocumentFromDB(doc: Document) {
    const metadataP = deleteFromDB(DBs.METADATA, doc.id);
    const previewsP = deleteFromDB(DBs.PREVIEWS, doc.id);
    const layersPs = doc.layers.map(l => deleteFromDB(DBs.LAYERS, l.id));
    return new Promise((resolve, reject) => {
        Promise.all([metadataP, previewsP, ...layersPs]).then(() => {
            resolve(null);
        })
    })
}