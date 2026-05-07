# IP Lookup — Userscript

A userscript that lets you instantly look up any IP address on any webpage using [ipinfo.io](https://ipinfo.io/). Works with any userscript manager — Tampermonkey, Violentmonkey, or Greasemonkey.

## Features

- **Select any IPv4 or IPv6 address** on any page — a small floating bubble appears above your selection
- **Click the bubble** to trigger a live lookup (no right-click needed, zero interference with buttons or links)
- **Draggable result panel** — shows geolocation, ASN/org, timezone, hostname, and a Google Maps link for the coordinates
- **Bogon/private IP detection** — private and reserved addresses are flagged with a warning
- **Token support** — configure your ipinfo.io API token via the userscript manager menu (stored securely in GM storage)
- **Works everywhere** — matches `*://*/*`; tested on OPNsense

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
   - [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) (Firefox)
2. Open [`ip-lookup.user.js`](ip-lookup.user.js) and click **Install** when prompted

## Usage

| Action | Result |
|---|---|
| Select an IP address on any page | Lookup bubble appears above the selection |
| Click the bubble | Result panel opens with IP details |
| Drag the panel header | Reposition the panel anywhere on screen |
| Press `Escape` | Close bubble / panel |
| Click `×` on the panel | Close the result panel |

## Token Configuration

The free anonymous tier of ipinfo.io allows **50,000 requests/month**. If you need more, set your token via the userscript manager menu:

- **⚙ Set ipinfo.io Token** — enter your token (stored in GM storage by your userscript manager, never sent anywhere else)
- **✕ Clear ipinfo.io Token** — revert to anonymous access

## Fields Displayed

| Field | Description |
|---|---|
| IP | The queried address |
| Hostname | Reverse DNS |
| City / Region / Country | Geolocation |
| Org | ISP / organization |
| ASN | Autonomous system number |
| Timezone | IANA timezone |
| Postal | Postal code |
| Location | Lat/lon — links to Google Maps |

## Requirements

- A userscript manager: [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/)
- Any modern browser (Chrome, Firefox, Edge, Safari)

## License

MIT
