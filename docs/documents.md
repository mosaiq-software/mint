## Document
Documents represent projects. They contain contextual information like an ID, name, and size, as well as a list of layers. The rendering engine processes each layer in order, compositing them using alpha blending to create a final image.

## Layers
Every layer has certain shared fields (`BaseLayer`) used by the rendering engine. This includes basic information like its ID and name, but also information that dictates how it appears on the canvas, like its opacity, visibility, and importantly, a transformation matrix.

Different layer types can extend this base type using a unique `type` as well as a set of fields.