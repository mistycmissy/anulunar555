# Mystic Missy’s Magick Eight Ball

A standalone digital oracle that works offline and can receive updated answer packs from GitHub whenever internet access is available.

## Files

- `index.html`: the complete customer-facing oracle
- `messages.json`: the remotely updateable official message library

## How customer updates work

The HTML contains a small built-in fallback collection, so it always works offline. It checks this public GitHub file once per day when online:

`https://raw.githubusercontent.com/mistycmissy/anulunar555/main/magic-eight-ball/messages.json`

A customer can also press **Check for Cosmic Updates**. Valid message packs are saved in the browser's local storage for future offline use.

## Add or edit answers

Edit `messages.json` and:

1. Add, remove, or revise entries inside the `messages` array.
2. Increase `version`, such as `1.0.0` to `1.1.0`.
3. Update `updatedAt` using `YYYY-MM-DD`.
4. Commit the file to the `main` branch.

Customers receive the new library the next time their copy checks for updates while connected to the internet.

## Important business note

Anyone who knows the public `messages.json` URL can read the answer library. This version is ideal for easy updates and simple delivery, but it does not provide strong copy protection. A later premium version can move the message library behind a licensed API or customer login.

## Test locally

Open `index.html` directly in a browser. The oracle works without a web server. Internet access is only needed to retrieve future message updates.
