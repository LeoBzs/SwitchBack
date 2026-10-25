# SwitchBack
Application designed for helping intercept http calls.

Currently a Chrome extension (Manifest V3) that redirects requests by replacing a string in the URL.

## Example

| If URL contains       | Replace with            |
| --------------------- | ----------------------- |
| `https://website.com` | `http://localhost:2000` |

`https://website.com/something?x=1` → `http://localhost:2000/something?x=1`

The first occurrence of the string is replaced, and the rest of the URL is kept. This applies to page loads and to XHR/fetch, scripts, images and other requests.

### Only if the URL contains something

The optional **Only if URL contains** field limits a rule to matching URLs:

| Only if URL contains | Replace               | With                    |
| -------------------- | --------------------- | ----------------------- |
| `?id=1`              | `https://website.com` | `http://localhost:8000` |

- `https://website.com/page?id=1` → `http://localhost:8000/page?id=1`
- `https://website.com/page?id=2` → unchanged

## Install (development)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this folder
4. Click the SwitchBack icon in the toolbar to add rules

After editing the code, click the reload icon on the extension card.
