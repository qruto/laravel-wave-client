# Changelog

## [Unreleased](https://github.com/qruto/laravel-wave-client/compare/0.8.1...main)

Support Laravel Echo **2.x** (`laravel-echo` `^2.5.0`).

`WaveConnector` now implements Echo 2's connection status API: `Echo.connectionStatus()`
and `connector.onConnectionChange(callback)` report `connecting`, `connected`,
`reconnecting`, `failed` and `disconnected` states of the event stream.

`Channel.stopListening(event, callback)` removes only the given callback instead of every
listener of that event.

Installing straight from the repository now works: a `prepare` script builds `dist` on
install, and an `exports` map points ESM consumers at the ES module build.

## [0.8.1](https://github.com/qruto/laravel-wave-client/compare/0.8.0...0.8.1) - 2024-06-30

Make `authEndpoint` optional

## [0.8.0](https://github.com/qruto/laravel-wave-client/compare/0.7.3...0.8.0) - 2023-12-12

Fixed several bugs with presence channel state management.

## [0.7.3](https://github.com/qruto/laravel-wave-client/compare/0.7.2...0.7.3) - 2023-07-20

Removed ide files from publish bundle.

## [0.7.2](https://github.com/qruto/laravel-wave-client/compare/0.7.1...0.7.2) - 2023-07-20

Various bug fixes.

Improved presence channels synchronization.

## [0.7.1](https://github.com/qruto/laravel-wave-client/compare/0.7.0...0.7.1) - 2023-06-09

Fix iife build

## [0.7.0](https://github.com/qruto/laravel-wave-client/compare/0.5.1...0.7.0) - 2023-06-09

Migrate to fetch based event sourcing – [Azure/fetch-event-source](https://github.com/Azure/fetch-event-source)

[Release notes](https://github.com/qruto/laravel-wave/releases/tag/0.7.0)  📣 ➡︎

## [0.5.1](https://github.com/qruto/laravel-wave-client/compare/0.7.0...0.7.0) - 2022-08-02

Fixed IIFE build

## [0.5.0](https://github.com/qruto/laravel-wave-client/compare/07afd90...0.5.0) - 2022-08-01

First release  🎉 Works well in the home environment, but should be battle tested before **1.0**.

Checkout ➡️ [README](https://github.com/qruto/laravel-wave/blob/main/README.md).
