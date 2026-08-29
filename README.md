# Mint

Mint is a digital compositing tool for the web. It can be used to crop and resize images, create collages, build mockups, or otherwise complete basic compositing tasks. It supports image manipulation, drawings, text, and basic shapes. Mint is built as a static website, meaning it can be easily hosted locally or used as an internal tool.

Try it out at [https://mint.photo](https://mint.photo).

Mint was created by [Sam Randa](https://github.com/notsoli) and [Alex Santagata](https://www.linkedin.com/in/alex-santagata) for [Mosaiq Software](https://mosaiq.dev/).

## Run locally

```bash
npm install
npm run dev
```

## Build static site

```bash
npm run build
```

Build output is generated in `dist/` and can be hosted as a static site.

## Technologies

Mint uses the [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) for its core rendering engine, [Svelte](https://github.com/sveltejs/svelte) for its user interface, and [Melt UI](https://github.com/melt-ui/melt-ui) for interface components.

## Contributing

Mint welcomes issue reports, feature additions, and bug fixes from everyone. Feel free to open new issues or pull requests.
