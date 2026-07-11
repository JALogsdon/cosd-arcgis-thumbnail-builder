# Thumbnail Builder for ArcGIS Online (City of San Diego)

A web app for creating item and group thumbnails for ArcGIS Online content using HTML5 Canvas, styled to City of San Diego design standards. Runs entirely in the browser as a static site.

<https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/>

> Independent community project. Not affiliated with or endorsed by Esri. "ArcGIS" is a trademark of Esri.

---

## Features

- **Item thumbnails** (600x400) — title bar, sidebar item-type label, logo, and background
- **Group thumbnails** (400x400) — title bar, logo, and background
- Live template previews for City departments and SanGIS, rendered from the same drawing code as the output
- Auto-fitting, wrapped title text; logo scale and an optional white outline for busy backgrounds
- Title and color blocks with RGBA control via color picker (with a hex field)
- Upload a file, paste an image URL, or drag-and-drop an image onto the preview
- Light/dark mode that persists across pages
- Shareable "Copy link" URLs that reproduce your text, colors, and image URLs
- Works as a static site (no build step or server-side code)

---

## Image Guidelines

Backgrounds are center-cropped to the canvas aspect ratio, then scaled to fill. Logos are scaled to fit inside a square box (never cropped), so transparent PNGs sit cleanly on the background.

### Item Thumbnails (600x400)

- **Output canvas:** 600x400 px (3:2 / 1.5:1)
- **Background:** center-cropped to 1.5:1, then scaled to fill 600x400
- **Logo:** scaled to fit a 120 px box (times `logoScale`), never cropped; transparent PNG recommended, 256x256 px or larger

### Group Thumbnails (400x400)

- **Output canvas:** 400x400 px (1:1)
- **Background:** center-cropped to 1:1, then scaled to fill 400x400
- **Logo:** scaled to fit a 100 px box (times `logoScale`), never cropped; transparent PNG recommended, 256x256 px or larger

---

## Query Parameters

Both `index.html` (item thumbnails) and `group.html` (group thumbnails) support URL query parameters for preconfiguration. (The old `viewer.html` path still works — it redirects to `index.html`.)

### Item Thumbnail (`index.html`)

| Parameter      | Description                                     | Values         | Example                          |
| -------------- | ---------------------------------------------- | -------------- | -------------------------------- |
| `background`   | Background image URL                            | URL            | `https://path.to/background.jpg` |
| `logo`         | Logo image URL                                  | URL            | `https://path.to/logo.png`       |
| `title`        | Title text                                      | String         | `My Title`                       |
| `titleColor`   | Title bar color                                 | `r,g,b,a`      | `0,152,219,0.9`                  |
| `category`     | Sidebar label (ArcGIS item type)                | String         | `Web Map`                        |
| `sidebarColor` | Sidebar color                                   | `r,g,b,a`      | `255,160,47,0.9`                 |
| `logoScale`    | Logo size multiplier (default `1`)              | Number         | `1.6`                            |
| `logoStroke`   | White outline width in px for busy backgrounds  | Number         | `1.5`                            |
| `theme`        | Force light or dark mode                        | `light`/`dark` | `dark`                           |

**Example URL:**

```url
https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/index.html?background=https://path.to/background.jpg&logo=https://path.to/logo.png&title=My%20Title&titleColor=0,152,219,0.9&sidebarColor=255,160,47,0.9&category=Web%20Map
```

### Group Thumbnail (`group.html`)

Group thumbnails have no sidebar, so `category` and `sidebarColor` do not apply.

| Parameter    | Description                                    | Values         | Example                          |
| ------------ | ---------------------------------------------- | -------------- | -------------------------------- |
| `background` | Background image URL                           | URL            | `https://path.to/background.jpg` |
| `logo`       | Logo image URL                                 | URL            | `https://path.to/logo.png`       |
| `title`      | Title text                                     | String         | `My Group`                       |
| `titleColor` | Title bar color                                | `r,g,b,a`      | `0,152,219,0.9`                  |
| `logoScale`  | Logo size multiplier (default `1`)             | Number         | `1.6`                            |
| `logoStroke` | White outline width in px for busy backgrounds | Number         | `1.5`                            |
| `theme`      | Force light or dark mode                       | `light`/`dark` | `dark`                           |

**Example URL:**

```url
https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/group.html?background=https://path.to/background.jpg&logo=https://path.to/logo.png&title=My%20Group&titleColor=0,152,219,0.9
```

---

## Contributing and Support

- Open issues and feature requests here:
  <https://github.com/JALogsdon/cosd-arcgis-thumbnail-builder/issues>

---

## Attribution

This project is a fork of **ArcGISThumbnailBuilder** by Joshua Tanner (Oregon Geospatial Enterprise Office):

- Original: <https://github.com/tannerjt/ArcGISThumbnailBuilder>
- Fork: <https://github.com/JALogsdon/cosd-arcgis-thumbnail-builder>

Credit for the original concept and implementation belongs to the original author. On top of City of San Diego branding, this fork adds a group thumbnail builder, live template previews, auto-fitting titles, logo scale and outline options, light/dark mode, drag-and-drop and paste-a-URL image input, and shareable links.

---

## AI Disclosure

Generative AI tools were used in this project with human oversight, no sensitive data exposure, and in compliance with the City's AI Policy (effective 9/13/2024).

---

## Project Repository

[cosd-arcgis-thumbnail-builder](https://github.com/JALogsdon/cosd-arcgis-thumbnail-builder)

## License

[GNU General Public License v3.0](LICENSE). This fork inherits the GPL-3.0 license of the upstream project ([tannerjt/ArcGISThumbnailBuilder](https://github.com/tannerjt/ArcGISThumbnailBuilder)) and must remain GPL-3.0.
