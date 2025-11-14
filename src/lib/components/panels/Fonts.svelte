<script lang="ts">
    import { Combobox } from "melt/builders";

    const FONTS: Record<string, string[]> = {
        'Windows': ["Arial", "Arial Black", "Bahnschrift", "Calibri", "Cambria", "Candara", "Comic Sans MS", "Consolas", "Constantia", "Corbel", "Courier New", "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia", "Impact", "Ink Free", "Javanese Text", "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic", "Marlett", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti", "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI", "Palatino Linotype", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI",  "SimSun", "Sitka", "Sylfaen", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Yu Gothic"],
        'MacOS': ["American Typewriter", "Andale Mono", "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS", "Avenir", "Avenir Next", "Avenir Next Condensed", "Baskerville", "Big Caslon", "Bodoni 72", "Bradley Hand", "Brush Script MT", "Chalkboard", "Chalkboard SE", "Chalkduster", "Charter", "Cochin", "Comic Sans MS", "Copperplate", "Courier", "Courier New", "Didot", "DIN Alternate", "DIN Condensed", "Futura", "Geneva", "Georgia", "Gill Sans", "Helvetica", "Helvetica Neue", "Herculanum", "Hoefler Text", "Impact", "Lucida Grande", "Luminari", "Marker Felt", "Menlo", "Microsoft Sans Serif", "Monaco", "Noteworthy", "Optima", "Palatino", "Papyrus", "Phosphate", "Rockwell", "Savoye LET", "SignPainter", "Skia", "Snell Roundhand", "Tahoma", "Times", "Times New Roman", "Trattatello", "Trebuchet MS", "Verdana", "Zapfino"],
        'Linux': ["Arial", "Arial Black", "C059", "Cantarell", "Comic Sans MS", "Courier New", "D050000L", "DejaVu Sans", "DejaVu Sans Mono", "DejaVu Serif", "FreeMono", "FreeSans", "FreeSerif", "Georgia", "Impact", "Liberation Mono", "Liberation Sans", "Liberation Serif", "Microsoft Sans Serif", "Nimbus Mono PS", "Nimbus Roman", "Nimbus Sans", "Nimbus Sans Narrow", "Noto Color Emoji", "Noto Mono", "Noto Sans", "Noto Serif", "P052", "Standard Symbols PS", "Tahoma", "Times New Roman", "Trebuchet MS", "Ubuntu", "Ubuntu Mono", "URW Bookman", "URW Gothic", "Verdana", "Z003"]
    };

    function getUnfilteredSystemFonts() {
        const agent = navigator.userAgent;
        if (/Win/.test(agent)) return FONTS['Windows'];
        else if (/(Mac|iPhone|iPad|iPod)/.test(agent)) return FONTS['MacOS'];
        return FONTS['Linux'];
    }

    const unfilteredSystemFonts = $derived(getUnfilteredSystemFonts());

    let outerElement: HTMLDivElement | null = $state(null);

    let systemFonts: string[] = getUnfilteredSystemFonts();

    $effect(() => {
        if (outerElement && systemFonts.length === 0 && unfilteredSystemFonts.length > 0) {
            const [{spanMeasures: nullMeasures}, ...fontInfo] = Array.from(outerElement.children)
                .map((div, i) => {
                    const font = i === 0 ? '' : unfilteredSystemFonts[i - 1];
                    const spans = Array.from(div.children) as HTMLElement[];
                    const spanMeasures = spans.map(s => {
                        return {x: s.offsetWidth, y: s.offsetHeight};
                    });
                    return {font, spanMeasures};
                });
            systemFonts = fontInfo.filter(({spanMeasures}) => {
                return !(
                    nullMeasures[0].x === spanMeasures[0].x
                    && nullMeasures[0].y === spanMeasures[0].y
                    && nullMeasures[1].x === spanMeasures[1].x
                    && nullMeasures[1].y === spanMeasures[1].y
                    && nullMeasures[2].x === spanMeasures[2].x
                    && nullMeasures[2].y === spanMeasures[2].y
                );
            }).map(({font}) => font as string);
            outerElement.remove();
        }
    });
</script>

<div bind:this={outerElement} id="font-wrapper">
    <div class="font-measure">
        <span style:font-family="serif">mmmmmmmmmmlli</span>
        <span style:font-family="sans-serif">mmmmmmmmmmlli</span>
        <span style:font-family="monospace">mmmmmmmmmmlli</span>
    </div>
    {#each unfilteredSystemFonts as font}
        <div class="font-measure">
            <span style:font-family={`"${font}", serif`}>mmmmmmmmmmlli</span>
            <span style:font-family={`"${font}", sans-serif`}>mmmmmmmmmmlli</span>
            <span style:font-family={`"${font}", monospace`}>mmmmmmmmmmlli</span>
        </div>
    {/each}
</div>

<style>
    #font-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .font-measure {
        position: absolute;
        top: 0;
        left: 0;
        white-space: pre-wrap;
        word-break: break-word;
    }
</style>