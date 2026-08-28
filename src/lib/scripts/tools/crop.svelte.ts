import type { Tool } from ".";

/** The scale directions represented by each scale handle */
export type ScaleDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** The current crop tool action */
export type CropAction =
    | {
          type: "idle";
      }
    | {
          type: "move";
      }
    | {
          type: "scale";
          direction: ScaleDirection;
      };

const crop: {
    action: CropAction;
    dragging: boolean;
} = $state({
    action: { type: "idle" },
    dragging: false,
});

export const cropTool: Tool = {
    name: "crop",
    onPointerDown: (data) => {},
    onPointerMove: (data) => {},
};

export default crop;
