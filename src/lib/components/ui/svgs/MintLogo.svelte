<script lang="ts">
    interface Props {
        size?: number;
        color?: string;
    }

    const {
        size = 24,
        color = '#000',
    }: Props = $props();
</script>

<svg width="{size}px" height="{size}px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;stroke-width:200px;stroke:{color};">
    <g transform="matrix(0.0100663,0,0,0.00995639,-4.68316,-3.47376)">
        <path d="M767.502,1655.5C767.502,1655.5 891.368,957.997 1741.96,946.467C2316.52,938.678 2532.35,956.171 2675.26,799.622C2858.04,599.413 2592.09,329.402 2386.06,533.459C2267.19,651.189 2298.3,835.8 2342.3,992.642C2407.09,1223.56 2400.41,1579.78 2253.51,1824.89C2106.6,2070.01 1897.61,2208.28 1623.22,2249.36C1294.29,2298.61 1147.73,2221.75 1147.73,2221.75" style="fill:none;"/>
    </g>
    <g transform="matrix(0.0100663,0,0,0.00995639,-4.68316,-3.47376)">
        <path d="M576.616,2652.69C576.616,2652.69 539.988,2256.13 928.612,1969.34C1373.45,1641.06 1762.3,1719.99 1950.92,1271.58" style="fill:none;"/>
    </g>
</svg>