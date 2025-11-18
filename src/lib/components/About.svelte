<script lang="ts">
    import MintLogo from "./ui/svgs/MintLogo.svelte";
    import { ButtonVisual } from "./ui";
    import RotateHandleIcon from "./ui/svgs/RotateHandleIcon.svelte";
    import ScaleHandleIcon from "./ui/svgs/ScaleHandleIcon.svelte";
    import {
        ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
        MousePointer2, Brush, Eraser, Type, PaintBucket,
        Square, Circle, Plus, X, SquareDashed, MoveHorizontal
    } from "@lucide/svelte";

    const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
    const ctrl = isMacLike ? '⌘' : 'Ctrl';
    const keySVGSize = 12;

    let {open = $bindable()}: {open: boolean} = $props();

    function handleOuterClick(event: MouseEvent) {
        if ((event.target as HTMLElement).id === 'outer') open = false;
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') open = false;
    }
</script>

<div id="outer" class:closed={!open}
     onclick={handleOuterClick}
     onkeydown={handleKeyDown}
>
    <div id="modal">

        <div id="about">
            <h2 class="heading">
                <MintLogo color="var(--c-acc)" />
                Mint
            </h2>
            <section>
                <p>
                    Mint is a digital compositing tool for the web.
                    It can be used to crop and resize images, create collages,
                    build mockups, or otherwise complete basic compositing tasks.
                    It supports image manipulation, drawings, text, and basic shapes.
                    Mint is built as a static website, meaning it can be easily hosted
                    locally or used as an internal tool.
                </p>
                <p>
                    Mint was created by
                    <a href="https://samranda.com/" target="_blank">Sam Randa</a> and
                    <a href="https://alexsantagata.dev/" target="_blank">Alex Santagata</a> for
                    <a href="https://mosaiq.dev/" target="_blank">Mosaiq Software</a>.
                </p>
            </section>
            <h2 class="heading">Using Mint</h2>
            <section>
                <p>
                    Mint aims to be intuitive for new users while offering a full
                    breadth of image editing features for experienced designers.
                    The following guide aims to clarify the logic by which Mint operates.
                </p>
                <h3 class="heading">Documents and layers</h3>
                <section>
                    <p>
                        Images on Mint are called <i>documents</i>.
                        Documents on Mint consist of visual <i>layers</i> representing
                        individual components of an image.
                    </p>
                    <p>
                        The layers on a document are listed in a stack on the right sidebar.
                    </p>
                    <p>
                        There are four varieties of layers available:
                    </p>
                    <ul class="bulleted-list">
                        <li>
                            <i>Canvas</i> layers, which consist of a bitmap image.
                        </li>
                        <li>
                            <i>Text</i> layers, which render text.
                        </li>
                        <li>
                            <i>Rectangle</i> layers, which render a rectangle
                            which can be bordered or rounded.
                        </li>
                        <li>
                            <i>Ellipse</i> layers, which render an ellipse
                            which can be bordered or rounded.
                        </li>
                    </ul>
                    <p>
                        All layer types can be moved, rotated, scaled and flipped,
                        both individually and in combination.
                    </p>
                </section>
                <h3 class="heading">Operations on documents</h3>
                <section>
                    <table>
                        <thead>
                        <tr>
                            <th>Action</th>
                            <th>Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Click <ButtonVisual>Create Document</ButtonVisual></td>
                            <td><p>Create a new empty document.</p></td>
                        </tr>
                        <tr>
                            <td>Click <ButtonVisual>Import Image</ButtonVisual></td>
                            <td><p>Opens a dialog to choose an image from your device.
                            Creates a document consisting of that image on its own
                            Canvas layer.</p></td>
                        </tr>
                        <tr>
                            <td>Drag an image to Mint from your device</td>
                            <td><ul>
                                <li>If no document is selected: create a new document
                                    consisting of that image on its own Canvas layer.</li>
                                <li>Otherwise: see below.</li>
                            </ul></td>
                        </tr>
                        <tr>
                            <td><kbd>{ctrl}</kbd>+<kbd>Z</kbd></td>
                            <td><p>Undo.</p></td>
                        </tr>
                        <tr>
                            <td><kbd>{ctrl}</kbd>+<kbd>Y</kbd></td>
                            <td><p>Redo.</p></td>
                        </tr>
                        <tr>
                            <td><kbd>{ctrl}</kbd>+<kbd>S</kbd></td>
                            <td>
                                <p>Save the document to your browser.
                                    This option can also be accessed from the file menu.</p>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </section>
                <h3 class="heading">Operations on layers</h3>
                <section>
                    <table>
                        <thead>
                        <tr>
                            <th>Action</th>
                            <th>Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Click <span class="icon-wrapper"><Plus size={16} /></span></td>
                            <td>
                                <p>Create a new blank canvas layer.</p>
                            </td>
                        </tr>
                        <tr>
                            <td>Click on a layer</td>
                            <td>
                                <p>Select that layer.</p>
                            </td>
                        </tr>
                        <tr>
                            <td><kbd>Shift</kbd>+click on a layer</td>
                            <td>
                                <p>Select multiple layers.</p>
                            </td>
                        </tr>
                        <tr>
                            <td>Drag an image to the canvas from your device</td>
                            <td>
                                <ul class="bulleted-list">
                                    <li>If dropped inside the canvas: create a new canvas layer consisting of that image.</li>
                                    <li>
                                        If dropped on one side of the canvas: create a new canvas
                                        layer on that side of the canvas. (This changes the size of the canvas
                                        and resizes the image to fit inside.)
                                    </li>
                                    <li>
                                        If no document is selected: see above.
                                    </li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td>Drag a layer up or down the stack</td>
                            <td>
                                <p>
                                    Change the order of the layers. This determines how
                                    layers overlap.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td><kbd>{ctrl}</kbd>+<kbd>C</kbd></td>
                            <td><p>Copy the selected layer(s).</p></td>
                        </tr>
                        <tr>
                            <td><kbd>{ctrl}</kbd>+<kbd>V</kbd></td>
                            <td><p>Paste the selected layer(s).</p></td>
                        </tr>
                        <tr>
                            <td>Double-click on a layer's name</td>
                            <td>
                                <p>Rename a layer.</p>
                            </td>
                        </tr>
                        <tr>
                            <td>Click <span class="icon-wrapper"><X size={16} /></span></td>
                            <td>
                                <p>Delete a layer.</p>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <p>For more operations on layers, see Tools below.</p>
                </section>
                <h3 class="heading">Colors</h3>
                <section>
                    <p>
                        Each layer stores two colors, a "foreground" and "background" color.
                        You can click on either color in the bottom-left to change it to any RGBA or HSLA color.
                        You can click <span class="icon-wrapper"><MoveHorizontal size={16} /></span> to swap the foreground and
                        background colors on a selected layer.
                    </p>
                    <p>
                        The type of the layer determines what these colors mean:
                    </p>
                    <table>
                        <thead>
                        <tr>
                            <th>Layer</th>
                            <th>Foreground color</th>
                            <th>Background color</th>
                        </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Canvas</td>
                                <td>The color of new brushstrokes or fills.</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Text</td>
                                <td>The color of the text.</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Rectangle</td>
                                <td>The inside of the rectangle.</td>
                                <td>The border of the rectangle.</td>
                            </tr>
                            <tr>
                                <td>Ellipse</td>
                                <td>The inside of the ellipse.</td>
                                <td>The border of the ellipse.</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                <h3 class="heading">Tools</h3>
                <section>
                    <p>
                        <i>Tools</i> are your means of modifying layers.
                        Mint provides the following tools:
                    </p>
                    <table id="tools">
                        <thead>
                        <tr>
                            <th>Tool</th>
                            <th>Key</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Select (<span class="icon-wrapper"><MousePointer2 size={16} /></span>)</td>
                            <td><kbd>S</kbd></td>
                            <td>
                                <ul class="bulleted-list">
                                    <li>
                                        Click on a layer to select it.
                                    </li>
                                    <li>
                                        <kbd>Shift</kbd>+click to select multiple layers.
                                    </li>
                                    <li>
                                        Move the box <span class="icon-wrapper"><SquareDashed size={16} /></span> to move the selected layer(s).
                                    </li>
                                    <li>
                                        Move the circular handle <span class="icon-wrapper"><RotateHandleIcon /></span> to rotate the selected layer(s).
                                    </li>
                                    <li>
                                        Move the square handles <span class="icon-wrapper"><ScaleHandleIcon /></span> to scale the selected layer(s).
                                        <ul class="bulleted-list">
                                            <li>
                                                <kbd>Shift</kbd>+move the square handles <span class="icon-wrapper"><ScaleHandleIcon /></span> to
                                                preserve a layer's aspect ratio while scaling.
                                            </li>
                                        </ul>
                                    </li>
                                    <li>Press the arrow keys <kbd><ArrowLeft size={keySVGSize} /></kbd>
                                        <kbd><ArrowUp size={keySVGSize} /></kbd>
                                        <kbd><ArrowRight size={keySVGSize} /></kbd>
                                        <kbd><ArrowDown size={keySVGSize} /></kbd> to move the selected layer(s).</li>
                                    <li>Press <kbd>Shift</kbd>+the arrow keys <kbd><ArrowLeft size={keySVGSize} /></kbd>
                                        <kbd><ArrowUp size={keySVGSize} /></kbd>
                                        <kbd><ArrowRight size={keySVGSize} /></kbd>
                                        <kbd><ArrowDown size={keySVGSize} /></kbd> to move the selected layer(s) further.</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td>Draw (<span class="icon-wrapper"><Brush size={16} /></span>)</td>
                            <td><kbd>D</kbd></td>
                            <td>
                                <ul class="bulleted-list">
                                    <li>If the selected layer is a Canvas layer: click and drag to draw a brushstroke.</li>
                                    <li>Otherwise: click to create a new Canvas layer.</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td>Erase (<span class="icon-wrapper"><Eraser size={16} /></span>)</td>
                            <td><kbd>E</kbd></td>
                            <td>
                                <p>
                                    If the selected layer is a Canvas layer:
                                    click and drag to erase.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td>Text (<span class="icon-wrapper"><Type size={16} /></span>)</td>
                            <td><kbd>T</kbd></td>
                            <td>
                                <ul class="bulleted-list">
                                    <li>If the selected layer is a Text layer: <ul class="bulleted-list">
                                        <li>Type in the text box to edit the text.</li>
                                        <li>Press <kbd>{ctrl}</kbd>+<kbd>B</kbd> to toggle <b>bold</b>.</li>
                                        <li>Press <kbd>{ctrl}</kbd>+<kbd>I</kbd> to toggle <i>italics</i>.</li>
                                    </ul></li>
                                    <li>Otherwise: click to create a new Text layer.</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td>Fill (<span class="icon-wrapper"><PaintBucket size={16} /></span>)</td>
                            <td><kbd>F</kbd></td>
                            <td>
                                <p>
                                    If the selected layer is a Canvas layer:
                                    click to fill a region.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td>Rectangle (<span class="icon-wrapper"><Square size={16} /></span>)</td>
                            <td><kbd>R</kbd></td>
                            <td>
                                <p>
                                    Click and drag to create a new Rectangle layer.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td>Ellipse (<span class="icon-wrapper"><Circle size={16} /></span>)</td>
                            <td><kbd>C</kbd></td>
                            <td>
                                <p>
                                    Click and drag to create a new Ellipse layer.
                                </p>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </section>
            </section>
            <h2 class="heading">See Mint in action</h2>
            <p>Here's where images go OK?</p>
            <h2 class="heading">Contributing to Mint</h2>
            <section>
                <p>
                    Mint is an open-source project and welcomes contributions from outside developers.
                    To contribute to Mint, please give us monayyy.
                </p>
                <h3 class="heading">Technologies</h3>
                <section>
                    <p>Mint uses the following technologies:</p>
                    <ul class="bulleted-list">
                        <li><a href="https://svelte.dev/" target="_blank">Svelte 5</a> as a frontend framework;</li>
                        <li>The <a href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API" target="_blank">Canvas API</a> for rendering images;</li>
                        <li>The <a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API" target="_blank">IndexedDB API</a> for local persistence;</li>
                        <li><a href="https://next.melt-ui.com/" target="_blank">Melt UI</a> for UI components;</li>
                        <li>and <a href="https://lucide.dev/" target="_blank">Lucide</a> for icons.</li>
                    </ul>
                </section>
            </section>
        </div>
    </div>
</div>

<style>
    section {
        padding-left: var(--s-lg);
        border-left: var(--s-xs) solid var(--c-mid);
    }

    ul {
        list-style: disc;
        padding-left: var(--s-lg);
    }

    p, ul, h2, h3 {
        margin: 0.5rem 0;
    }

    ul ul {
        margin: 0;
    }

    h2 {
        font-size: 1.5rem;
    }

    h3 {
        font-size: 1.1rem;
    }

    h2, h3 {
        font-weight: 700;
    }

    h2, h3 {
        vertical-align: middle;
    }

    #outer {
        width: 100dvw;
        height: 100dvh;
        padding: var(--s-xl);
        background: #0003;
        backdrop-filter: blur(2px);
        position: fixed;
        left: 0;
        top: 0;
    }

    .closed {
        display: none;
    }

    #modal {
        width: 100%;
        height: 100%;
        padding: var(--s-xl);
        border-radius: var(--s-xl);
        background: var(--c-sur);
        box-shadow: 0 0 20px #0004;
        display: flex;
        gap: var(--s-xl);
    }

    #about {
        height: 100%;
        overflow-y: auto;
    }

    a {
        color: var(--c-acc);
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }

    table, th, td {
        border: var(--s-xs) solid var(--c-mid);
    }

    th, td {
        padding: var(--s-sm);
        text-align: center;
    }

    #tools td:nth-child(1), #tools td:nth-child(2) {
        text-align: center;
        white-space: nowrap;
    }

    ul, p {
        text-align: left;
    }

    table {
        border-collapse: collapse;
        width: 100%;
    }

    .icon-wrapper, kbd, svg {
        display: inline-block;
        vertical-align: middle;
    }
</style>