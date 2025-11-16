# Tools
Tools make up the primary mode of interaction between the user and the canvas. The structure of a tool can be found in `scripts/tools/index.ts`. Each tool has access to a number of functions that correspond to mouse and key events.

# State
Every tool consists of an implementation of the `Tool` type, often called `${toolName}Tool`, as well as a default export, often simply called `${toolName}` that includes any public state for the tool. The tool objects are compiled into a record that joins each mode to its respective tool. Each tool's state objects are then re-exported in `scripts/tools/index.ts` for easy access.

## Methods
Using the `PointerEventData` interface, mouse events are given the position of the cursor relative to the top left-corner of the canvas (`v`, or viewport space), scaled by the zoom level (`c`, or canvas space), transformed by the currently selected layer (`l`, or layer space), as well as the raw `MouseEvent` for additional context. For more discussion of coordinate and layer space, see the `Coordinate Systems` section. Pressing a mouse button will call the current tool's `onPointerDown` method, moving the mouse (regardless of button presses) will call the `onPointerMove` method, and releasing a mouse button will call the `onPointerUp` method. Keyboard events are simply given their raw `KeyboardEvent`. Pressing a key will call the current tool's `onKeyDown` method, while releasing a key will call `onKeyUp`.

## Purpose
Tool functions are intended to be the only way tools can respond to input events, ensuring consistency in event handling and ease of adding additional tools without significant restructuring. To make this possible, tools are encouraged to store their own internal state, which can then be modified by other components or used for computation. See the `State Management` section for examples.

Because of this, interactivity is almost entirely divorced from visuals. Tools can use information about the current document to define behavior, but should not define event listeners of their own. For example, the `Canvas` component renders a transformation box around the currently selected layer, which contains handles for scaling and rotating the layer. But, these handles do not have event listeners, and instead rely on the `select` tool's internal state to add hitboxes and functionality for the handles.