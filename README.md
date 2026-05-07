# IP Lookup — Tampermonkey Script

A Tampermonkey userscript that lets you instantly look up any IP address on any webpage using [ipinfo.io](https://ipinfo.io/).

## Features

- **Select any IPv4 or IPv6 address** on any page — a small floating bubble appears above your selection
- **Click the bubble** to trigger a live lookup (no right-click needed, zero interference with buttons or links)
- **Draggable result panel** — shows geolocation, ASN/org, timezone, hostname, and a Google Maps link for the coordinates
- **Bogon/private IP detection** — private and reserved addresses are flagged with a warning
- **Token support** — configure your ipinfo.io API token via the Tampermonkey extension menu (stored securely in GM storage)
- **Works everywhere** — matches `*://*/*`; tested on OPNsense

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open [`ip-lookup.user.js`](ip-lookup.user.js) and click **Install** when prompted by Tampermonkey

## Usage

| Action | Result |
|---|---|
| Select an IP address on any page | Lookup bubble appears above the selection |
| Click the bubble | Result panel opens with IP details |
| Drag the panel header | Reposition the panel anywhere on screen |
| Press `Escape` | Close bubble / panel |
| Click `×` on the panel | Close the result panel |

## Token Configuration

The free anonymous tier of ipinfo.io allows **50,000 requests/month**. If you need more, set your token via the Tampermonkey extension menu:

- **⚙ Set ipinfo.io Token** — enter your token (stored in Tampermonkey GM storage, never sent anywhere else)
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

- [Tampermonkey](https://www.tampermonkey.net/) v4.0+
- Any modern browser (Chrome, Firefox, Edge, Safari)

## License

MIT
