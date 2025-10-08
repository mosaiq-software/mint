## Document
Documents represent projects. They contain contextual information like an ID, name, and size, as well as a list of layers. The rendering engine processes each layer in order, compositing them using alpha blending to create a final image.

## Layers
Every layer has certain shared fields (`BaseLayer`) used by the rendering engine. This includes basic information like its ID and name, but also information that dictates how it appears on the canvas, like its opacity, visibility, and importantly, a transformation matrix.

Different layer types can extend this base type using a unique `type` as well as a set of fields.

## Tools
Tools make up the primary mode of interaction between the user and the canvas. The structure of a tool can be found in `scripts/tools/index.ts`. Each tool has access to a number of functions that correspond to mouse and key events. Using the `PointerEventData` interface, mouse events are given the position of the cursor on the full canvas (`c`, or canvas space), the currently selected layer (`l`, or layer space), as well as the raw `MouseEvent` for additional context. Keyboard events are simply given their raw `KeyboardEvent`. For more discussion of coordinate and layer space, see the `Coordinate Systems` section.

These functions are intended to be the only way tools can respond to input events, ensuring consistency in event handling and ease of adding additional tools without significant restructuring. To make this possible, tools are encouraged to store their own internal state, which can then be modified by other components or used for computation. See the `State Management` section for examples.

Because of this, interactivity is almost entirely divorced from visuals. Tools can use information about the current document to define behavior, but should not define event listeners of their own. For example, the `Canvas` component renders a transformation box around the currently selected layer, which contains handles for scaling and rotating the layer. But, these handles do not have event listeners, and instead rely on the `select` tool's internal state to add hitboxes and functionality for the handles.

## Coordinate Systems
Coordinate systems follow typical DOM conventions: (0, 0) represents the top left of the canvas or layer, and (width, height) represents the bottom right of the canvas or layer.

Two different types of coordinate spaces are frequently used Mint: canvas space and layer space. Canvas space simply refers to the mouse position relative to the canvas. Layer space is the canvas space with the inverse of the layer's transformation matrix applied to it. This means that, like canvas space, (0, 0) represents the top left of the layer, and (width, height) represents the bottom right of the layer, regardless of how it's scaled, moved, or rotated.

## State Management
Mint relies heavily on [global reactive state](https://svelte.dev/docs/svelte/svelte-js-files) for its state management. The two most important pieces of global state are `docs.svelte.ts` and `ui.svelte.ts`, which export `docs` and `ui` respectively. Components are encouraged to modify these core state objects directly.

Additionally, tools can keep track of their own global state, which can be used by panel components to modify their behavior. For example, `draw.svelte.ts` stores the current brush size and feather, which is modified by `Brush.svelte`.