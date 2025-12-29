# Model images (UI only)

Put per-model device images here so the **“Which device is it?”** grid can show real photos.

## Folder + naming convention

- Location: `public/devices/models/<category>/`
- Filename: `<slug>.png`

The UI generates the image URL like:

`/devices/models/<category>/<slug>.png`

Where `<slug>` is the model lowercased with spaces replaced by `-` and punctuation removed.

## Examples

- Model: `iPhone 14 Pro Max`
  - Category: `iphone`
  - File: `public/devices/models/iphone/iphone-14-pro-max.png`

- Model: `PS5 Slim`
  - Category: `ps5`
  - File: `public/devices/models/ps5/ps5-slim.png`

If an image is missing, the UI falls back to the **category** image.


