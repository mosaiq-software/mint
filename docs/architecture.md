## Coordinate Systems
Coordinate systems follow typical DOM conventions: `(0, 0)` represents the top left of the canvas or layer, and `(width, height)` represents the bottom right of the canvas or layer.

Three different coordinate spaces are frequently used Mint: viewport space, canvas space and layer space. Viewport space is simply the mouse position relative to the top-left of the canvas. Canvas space is scaled by the current zoom and pan, meaning that placing your mouse at the bottom-right of the canvas will always result in a canvas space coordinate of `(width, height)`. Layer space is the canvas space with the inverse of the layer's transformation matrix applied to it. This means that, like canvas space, `(0, 0)` represents the top left of the layer, and `(width, height)` represents the bottom right of the layer, regardless of how it's scaled, moved, or rotated.

# Tools
Tools make up the primary mode of interaction between the user and the canvas. The structure of a tool can be found in `scripts/tools/index.ts`. Each tool has access to a number of functions that correspond to mouse and key events.

## Document
Documents represent projects. They contain contextual information like an ID, name, and size, as well as a list of layers. The rendering engine processes each layer in order, compositing them using alpha blending to create a final image.

## Layers
Every layer has certain shared fields (`BaseLayer`) used by the rendering engine. This includes basic information like its ID and name, but also information that dictates how it appears on the canvas, like its opacity, visibility, and importantly, a transformation matrix. Different layer types can extend this base type using a unique `type` as well as a set of fields.

## State Management
Mint relies heavily on [global reactive state](https://svelte.dev/docs/svelte/svelte-js-files) for its state management. The two most important pieces of global state are `docs.svelte.ts` and `ui.svelte.ts`, which export `docs` and `ui` respectively. Components are encouraged to modify these core state objects directly.

Additionally, tools can keep track of their own global state, which can be used by panel components to modify their behavior. For example, `draw.svelte.ts` stores the current brush size and feather, which is modified by `Brush.svelte`.