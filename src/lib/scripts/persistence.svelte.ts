import {type Document, type DocumentID} from './docs.svelte';
import {render} from "./render";
import type {TextLayer, CanvasLayer} from "./layer";

enum DBs {
    METADATA = 'metadata',
    LAYERS = 'LAYERS',
    PREVIEWS = 'previews'
}

/**
 * Metadata: Record<DocumentID, metadata>.
 * Metadata is mostly the same as Document except for lastModified and removal of canvases.
 * Layers: Record<LayerID, Blob>. The blob represents imageData of a canvas layer.
 * Previews: Record<DocumentID, Blob>. The blob represents a preview of an entire document.
 */
interface DatabaseTypes {
    [DBs.METADATA]: Document & {
        layers: (TextLayer | (Omit<CanvasLayer, "canvas"> & {
            canvasDimensions: {
                width: number
                height: number
            }
        }))[],
        lastModified: number
    },
    [DBs.LAYERS]: Blob,
    [DBs.PREVIEWS]: Blob
}

/**
 * Opens a local database and accesses an object store.
 * @param name The name of the database.
 * @param version The version, important if we ever create new production DB schemas...
 * @returns A promise containing the database to be worked on.
 */
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

/**
 * Sets a <key, value> pair in a local database.
 * @param name The name of the database.
 * @param key The key.
 * @param value The value.
 */
async function putInDB(name: DBs, key: IDBValidKey, value: any) {
    const db = await workOnDatabase(name);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(name, 'readwrite');
        const req = tx.objectStore(name).put($state.snapshot(value), key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Gets a single value from a local database.
 * @param name The name of the database.
 * @param key The key of the entry.
 */
async function getFromDB<type extends DBs>(name: DBs, key: IDBValidKey) {
    const db = await workOnDatabase(name);
    return new Promise<DatabaseTypes[type]>((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const req = tx.objectStore(name).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);        
    })
}

/**
 * Gets several values from a local database.
 * @param name The name of the database.
 * @param keys The keys of the entries.
 */
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

/**
 * Deletes a <key, value> pair from a local database.
 * @param name The name of the database.
 * @param key The key of the entry.
 */
async function deleteFromDB(name: DBs, key: IDBValidKey) {
    const db = await workOnDatabase(name);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(name, 'readwrite');
        const req = tx.objectStore(name).delete(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Gets all values from a local database.
 * @param name The name of the database.
 */
async function getAllFromDB<type extends DBs>(name: DBs) {
    const db = await workOnDatabase(name);
    return new Promise<DatabaseTypes[type][]>((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const req = tx.objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    })
}

/**
 * Draws a blob on an offscreen canvas.
 * @param blob
 * @param ctx
 */
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

/**
 * Clamps the doc, preserving aspect ratio, to a 64x64 area for previews.
 * @param doc The document.
 * @returns The integer width and height of the clamped document.
 */
export function getPreviewSize(doc: Document) {
    const docOverPreviewSize = Math.floor(Math.max(doc.width, doc.height) / PREVIEW_MAX_SIZE);
    const pWidth = Math.floor(doc.width / docOverPreviewSize);
    const pHeight = Math.floor(doc.height / docOverPreviewSize);
    return {width: pWidth, height: pHeight};
}

/**
 * Gets a 64x64 preview of a document.
 * @param doc The document.
 * @returns A promise to a blob of a preview of a document.
 */
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

/**
 * Saves a document to the database.
 * Puts the document's metadata in the Metadata database,
 * each of the document's canvas layers in the Layers database,
 * and a preview of the document to the Previews database.
 * @param document The document.
 * @returns A promise to the (unmodified) document.
 */
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
/**
 * Gets an entire document from the database (Metadata + Layers).
 * @param docId The ID of the document.
 * @returns A promise to the document.
 */
export async function getDocumentFromDB(docId: DocumentID) {
    const doc = await getFromDB<DBs.METADATA>(DBs.METADATA, docId);

    const canvasLayers = doc.layers.filter(l => l.type === 'canvas');

    const layerIDs = canvasLayers.map(l => l.id);
    const layers = canvasLayers.length > 0 ? await getSeveralFromDB<DBs.LAYERS>(DBs.LAYERS, layerIDs) : [];

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

    if (canvasBlobPs.length > 0) {
        await Promise.all(canvasBlobPs);
    }

    return new Promise<Document>((resolve, reject) => {
        resolve(doc);
    });
}

/**
 * Gets previews and metadata for all documents.
 * @returns A promise to all documents (and previews and lastModified timestamps.)
 */
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

    return new Promise<(Document & {preview: OffscreenCanvas, lastModified: number})[]>((resolve, reject) => {
        resolve(fullDocs);
    });
}

/**
 * Deletes a document from the database.
 * @param doc The document to be deleted.
 * @returns A promise to null.
 */
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

/**
 * Updates the metadata of a document. Used for renaming from Welcome menu.
 * @param doc The partial document with document ID and updated fields.
 * @returns A promise to the updated document.
 */
export async function updateDocumentMetadata(doc: Partial<Document> & {id: DocumentID}) {
    const metadata = await getFromDB<DBs.METADATA>(DBs.METADATA, doc.id);
    const newMetadata = {...metadata, ...doc};
    return putInDB(DBs.METADATA, doc.id, newMetadata);
}