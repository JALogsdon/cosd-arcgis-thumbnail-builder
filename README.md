# COSD ArcGIS Thumbnail Builder

A simple web app for creating thumbnails for ArcGIS Online content using HTML5 Canvas. This fork adapts to the design standards for the City of San Diego.

<https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/>

---

## Features

- Background and logo placement with enforced sizes and aspect ratios
- Title and sidebar color blocks with RGBA control
- Query-parameter driven configuration for easy reuse/sharing
- Works as a static site (no build step or server-side code)

---

## Image Guidelines

- **Output canvas:** 600x400 px (1.5:1)
- **Background:** cropped to 1.5:1, then scaled to fill 600x400
- **Logo:** cropped to 1:1 and drawn at 145x145 px; transparent PNG recommended

---

## Query Parameters

You can preconfigure the thumbnail via URL query parameters:

| Parameter      | Description                | Values           | Example                          |
| -------------- | -------------------------- | ---------------- | -------------------------------- |
| `titleColor`   | Title bar background color | `r,g,b,a` (RGBA) | `0,152,219,0.9`                  |
| `sidebarColor` | Sidebar background color   | `r,g,b,a` (RGBA) | `255,158,23,0.9`                 |
| `background`   | Background image URL       | URL              | `https://path.to/background.png` |
| `logo`         | Logo image URL             | URL              | `https://path.to/logo.png`       |
| `title`        | Main title text            | String           | `City Streets Layer`             |

**Example URL:**

```url
https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/viewer.html?background=https://path.to/background.png&logo=https://path.to/logo.png&title=My%20Title&titleColor=0,152,219,0.9&sidebarColor=255,158,23,0.9
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
