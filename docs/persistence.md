# Persistence
Mint uses the IndexedDB API for local persistence. All elements of a document, including the Blob representing CanvasLayer image data, can be preserved across sessions on a device. All persistence operations are handled asynchronously in `persistence.svelte.ts`.

## IndexedDB
IndexedDB is preferred over the more common localStorage method for three reasons:
- IndexedDB has much looser size restrictions than localStorage.
- IndexedDB operations are asynchronous while localStorage operations are blocking. This is not desirable when reading and writing potentially large image files.
- IndexedDB can store any cloneable object, including Blobs, while localStorage can only store strings.

## Schema
Mint's `indexedDB` database consists of 3 `IDBDatabases` which each contain one `objectStore`. These correspond to tables in a more traditional back-end architecture, consisting of key-value records. These are:
- Metadata, which describes contextual information about a document such as its name, size, layer IDs etc. This also contains some information non-native to the `Document` object, including the last modified time and the dimensions of each `CanvasLayer`. 
- Layers, which contain Blobs describing the image content of one `CanvasLayer`. (Note these `Blob`s do not contain the dimensions of the image, so this is stored in the Metadata table.)
- Previews, which contain Blobs describing a maximum 64x64 preview of a `Document`. This is for rendering saved documents in `Welcome`.

## Versioning
When updating the database or the types that inform the database (`Document`, `Layer`), it is crucial to update the database version by incrementing `VERSION` in `persistence.svelte.ts`.

All database operations utilize `workOnDatabase`; this is where all versioning logic belongs. Utilize the `oldVersion` property of the `IDBVersionChangeEvent` in the `upgradeNeeded` listener to detect the current version, then follow [this](https://stackoverflow.com/a/34324949) pattern to update the database contents as needed.

It is best to try to avoid this. Note that versioning is not necessary for changes to these types that are purely additive, such as adding *optional* properties to `Document` or a new kind of layer to the compound `Layer` type. In other words, if the old `Document` or `Layer` type could be safely cast to the new, it is not necessary to re-version.