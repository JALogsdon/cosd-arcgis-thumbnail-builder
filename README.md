# COSD ArcGIS Thumbnail Builder

A simple web app for creating thumbnails for ArcGIS Online content using HTML5 Canvas. This fork adapts to the design standards for the City of San Diego.

<https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/>

---

## Features

- **Item thumbnails** (600x400) — title bar, sidebar category label, logo, and background
- **Group thumbnails** (400x400) — title bar, logo, and background
- Background and logo placement with enforced aspect-ratio cropping
- Title and color blocks with RGBA control via color picker
- Query-parameter driven configuration for easy reuse/sharing
- Works as a static site (no build step or server-side code)

---

## Image Guidelines

### Item Thumbnails (600x400)
- **Output canvas:** 600x400 px (1.5:1)
- **Background:** cropped to 1.5:1, then scaled to fill 600x400
- **Logo:** cropped to 1:1 and drawn at 145x145 px; transparent PNG recommended

### Group Thumbnails (400x400)
- **Output canvas:** 400x400 px (1:1)
- **Background:** cropped to 1:1, then scaled to fill 400x400
- **Logo:** cropped to 1:1 and drawn at 120x120 px; transparent PNG recommended

---

## Query Parameters

Both `viewer.html` (item thumbnails) and `group.html` (group thumbnails) support URL query parameters for preconfiguration.

### Item Thumbnail (`viewer.html`)

| Parameter      | Description          | Values    | Example                          |
| -------------- | -------------------- | --------- | -------------------------------- |
| `background`   | Background image URL | URL       | `https://path.to/background.png` |
| `logo`         | Logo image URL       | URL       | `https://path.to/logo.png`       |
| `title`        | Title text           | String    | `My Title`                       |
| `titleColor`   | Title bar color      | `r,g,b,a` | `0,152,219,0.9`                  |
| `sidebarColor` | Sidebar color        | `r,g,b,a` | `255,160,47,0.9`                 |
| `category`     | Sidebar label        | String    | `Web Map`                        |

**Example URL:**

```url
https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/viewer.html?background=https://path.to/background.png&logo=https://path.to/logo.png&title=My%20Title&titleColor=0,152,219,0.9&sidebarColor=255,160,47,0.9
```

### Group Thumbnail (`group.html`)

| Parameter    | Description          | Values    | Example                          |
| ------------ | -------------------- | --------- | -------------------------------- |
| `background` | Background image URL | URL       | `https://path.to/background.png` |
| `logo`       | Logo image URL       | URL       | `https://path.to/logo.png`       |
| `title`      | Title text           | String    | `My Group`                       |
| `titleColor` | Title bar color      | `r,g,b,a` | `0,152,219,0.9`                  |

**Example URL:**

```url
https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/group.html?background=https://path.to/background.png&logo=https://path.to/logo.png&title=My%20Group&titleColor=0,152,219,0.9
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

Credit for the original concept and implementation belongs to the original author. The COSD fork focuses on organizational wording, defaults, and documentation.

---

## AI Disclosure

Generative AI tools were used in this project with human oversight, no sensitive data exposure, and in compliance with the City's AI Policy (effective 9/13/2024).

---

## Project Repository

[cosd-arcgis-thumbnail-builder](https://github.com/JALogsdon/cosd-arcgis-thumbnail-builder)

## License

GNU General Public License v3.0
