import {type Document, type DocumentID} from './docs.svelte';
import {render} from "./render";

enum DBs {
    METADATA = 'metadata',
    LAYERS = 'LAYERS',
    PREVIEWS = 'previews'
}

interface DatabaseTypes {
    [DBs.METADATA]: Document,
    [DBs.LAYERS]: ImageData,
    [DBs.PREVIEWS]: ImageData
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
        const req = tx.objectStore(name).put(value, key);
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

async function getAllFromDB<type extends DBs>(name: DBs) {
    const db = await workOnDatabase(name);
    return new Promise<DatabaseTypes[type][]>((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const req = tx.objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    })
}

function getPreview(doc: Document): ImageData {
    const PREVIEW_MAX_SIZE = 32;
    const docOverPreviewSize = Math.floor(Math.max(doc.width, doc.height) / PREVIEW_MAX_SIZE);
    const canvas = new HTMLCanvasElement();
    canvas.width = doc.width;
    canvas.height = doc.height;
    render(canvas, doc);
    const pWidth = Math.floor(doc.width / docOverPreviewSize);
    const pHeight = Math.floor(doc.height / docOverPreviewSize);
    const preview = new OffscreenCanvas(pWidth, pHeight);
    const ptx = preview.getContext('2d');
    if (!ptx) return new ImageData(pWidth, pHeight);
    ptx.drawImage(canvas, 0, 0, pWidth, pHeight);
    return ptx.getImageData(0, 0, pWidth, pHeight);
}

export function saveDocumentToDB(document: Document, onsuccess: () => void = () => {}) {
    const docId = document.id;
    const promises = [
        putInDB(DBs.METADATA, docId, {
            ...document,
            layers: document.layers.map(l => {
                return {...l, canvas: undefined}
            })
        }),
        putInDB(DBs.PREVIEWS, docId, getPreview(document)),
        ...document.layers.filter(layer => layer.type === 'canvas').map(layer => {
            const canvas = layer.canvas;
            const ctx = canvas.getContext('2d');
            if (!ctx) return new Promise((res) => res(null));
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return putInDB(DBs.LAYERS, layer.id, imageData);
        })
    ];
    Promise.all(promises).then(onsuccess);
}

// for an actual document -- metadata + layers
export async function getDocumentFromDB(docId: DocumentID, onsuccess: (d: Document) => void) {
    const doc: Document = await getFromDB<DBs.METADATA>(DBs.METADATA, docId);
    const canvasLayers = doc.layers.filter(l => l.type === 'canvas');
    const layerPromises = canvasLayers.map(l =>
        getFromDB<DBs.LAYERS>(DBs.LAYERS, l.id)
    );

    Promise.all(layerPromises).then(results => {
        let resultIndex = 0;
        for (let i = 0; i < doc.layers.length; i++) {
            const l = doc.layers[i];
            if (l.type === 'canvas') {
                const imageData = results[resultIndex];
                l.canvas = new OffscreenCanvas(doc.width, doc.height);
                const ctx = l.canvas.getContext('2d');
                ctx?.putImageData(imageData, 0, 0);
                resultIndex++;
            }
        }
        onsuccess(doc);
    });
}

// for a document header -- metadata + preview
export async function getDocumentsFromDB(onsuccess: (d: (Document & {preview: OffscreenCanvas})[]) => void) {
    const docs = await getAllFromDB<DBs.METADATA>(DBs.METADATA);
    const previewPromises = docs.map(d => getFromDB<DBs.PREVIEWS>(DBs.PREVIEWS, d.id));
    Promise.all(previewPromises).then(results => {
        onsuccess(docs.map((d, index) => {
            const previewImage = results[index];
            const canvas = new OffscreenCanvas(previewImage.width, previewImage.height);
            const ctx = canvas.getContext('2d');
            ctx?.putImageData(previewImage, 0, 0);
            return {...d, preview: canvas};
        }))
    })
}