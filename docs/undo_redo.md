# Undo/Redo
Because the reactivity system cannot differentiate between an in-progress and completed action, the undo/redo system is one of the only pieces of state management handled manually.

## Usage
Whenever the user finishes performing an undoable operation, `postAction` should be called with the type of operation, layer ID, and the relevant piece of updated layer state.

## Action Types
The system uses a command pattern, in which every undoable operation is represented as an `Action` object. Each layer and document operation has its own action type, including `create`, `delete`, `transform`, `content` (canvas), `update` (property), `reorder`, `document`, and `compound` (batch) actions.

These operations are split into two action types: `Action` and `PostAction`. The former contains the `old` and `new` states of the layer or document, while `PostAction` types only contain the new state.

## Snapshot Management
To make the `PostAction` type possible, Mint captures snapshots of layers and documents upon initialization and after every recorded action. This way, developers do not have to keep track of the old state of a layer while an action (say, rotation) is in progress. Additionally, this eliminates the possibility of incorrect state management causing cascading effects as a piece of inaccurate initial layer state travels through the undo/redo stack.

Three types of snapshots exist: layer snapshots, document snapshots, and bounds snapshots. The former is used for every type of action, while the latter two are only used for `document` actions (changes to the document object), and `transform` actions use bounds snapshots to maintain bounding box rotation.

But, this system introduces additional complexity, as accidentally committing active object references to the undo/redo stack (i.e. incorrectly cloning object) can cause unpredictable and hard-to-debug issues with the undo/redo system. If any new layer interactions are added, they may need snapshots of their own to add undo/redo functionality.

## Process
Actions are saved on a stack with a maximum length of 50. When the user undoes an action, the old state of the current action is applied to the relevant layer, and the current action index decrements. When an action is redone, the new state of the current action is applied to the relevant layer, and the current action index increments. If an action is completed when the current action index is not at the end of the actions array, all subsequent actions are removed, and the new action is added. After any undo/redo, new snapshots of each relevant layer, document, and transform bounds are taken.