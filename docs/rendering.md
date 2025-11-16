# Rendering
Because the Canvas API takes care of almost every piece of desired rendering behavior, the rendering component of Mint is one of the simplest.

## Behavior
Whenever the layers in a document are changed, the document is re-rendered Layers are drawn in the order they appear in `docs.selected.layers`, meaning that the last layer in the layers array is the one that will appear on top.

Before rendering each layer, the layer transform is applied to the drawing context. After rendering a layer, this transformation is popped and replaced by that of the next layer.

For canvas layers, the canvas content is simply drawn to the main canvas.

For text layers, the text is first rendered into an invisible `<span>` element with the same dimensions and text properties as the text layer. This span is then used to calculate where the text wraps, separating the text into multiple strings representing each line of rendered text. Each line is then drawn to the main canvas with the specified text properties.

For rectangle layers, the fill content is rendered first using the specified width, height, and corner radius. The shape of the stroke is constructed manually by constructing a rounded rectangular path, modifying its position, size, and radius according to the stroke width and alignment. Ellipse layers are rendered similarly, constructing ellipse paths for the fill and stroke.

Importantly, shape objects are not scaled the same way as canvas and text layers. To preserve stroke uniformity, the actual size of shape objects are modified when scaling, rather than modifying the scale components of the transformation matrix. Unlike scale, a shape's translation and rotation are still determined by the transformation matrix.

## Performance
To simplify the rendering process, each layer is fully drawn before any subsequent layers, leading to overdraw if some layers occlude others. Additionally, layers are not cached between renders, meaning all transformations, text, and shapes are rendered after a change to any layer. These are fairly simple to address in the future, but have not been implemented due to a lack of performance concerns.