<p align="center">
    <picture>
        <source 
            width="350" 
            media="(prefers-color-scheme: dark)"
            srcset="https://github.com/qruto/laravel-wave/raw/HEAD/art/logo-dark.png"
        >
        <source
            width="350"
            media="(prefers-color-scheme: light)"
            srcset="https://github.com/qruto/laravel-wave/raw/HEAD/art/logo-light.png"
        >
        <img
            alt="Laravel Wave Logo"
            src="https://github.com/qruto/laravel-wave/raw/HEAD/art/logo-light.png"
            width="350"
        >
    </picture>
</p>
<p align="center">Bring <strong>live</strong> to your application</p>

<p align="center">
    <a href="https://github.com/qruto/laravel-wave-js/actions/workflows/tests.yml"><img src="https://github.com/qruto/laravel-wave-js/actions/workflows/tests.yml/badge.svg" alt="Build Status"></a>
    <a href="https://github.com/qruto/laravel-wave-js/actions/workflows/codeql-analysis.yml"><img src="https://github.com/qruto/laravel-wave-js/actions/workflows/codeql-analysis.yml/badge.svg" alt="Code Quality"></a>
    <a href="https://www.npmjs.com/package/laravel-wave"><img src="https://img.shields.io/npm/dt/laravel-wave" alt="Total Downloads"></a>
    <a href="https://www.npmjs.com/package/laravel-wave"><img src="https://img.shields.io/npm/v/laravel-wave" alt="Latest Stable Version"></a>
</p>

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/qruto/laravel-wave/raw/HEAD/art/connection-demo-dark.png">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/qruto/laravel-wave/raw/HEAD/art/connection-demo-light.png">
        <img alt="Laravel Wave Logo" src="https://github.com/qruto/laravel-wave/raw/HEAD/art/connection-demo-light.png" width="400">
    </picture>
</p>

# Introduction

Leverage Laravel's [broadcasting system](https://laravel.com/docs/master/broadcasting) for seamless communication between server and client using
🗼 [**Server-sent Events**](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).
This package is compatible with [Laravel Echo](https://github.com/laravel/echo).🐤

Enjoy a live [demo stream of tweets](https://wave.qruto.dev) 🐤.

## Support

I have spent a lot of effort playing with SSE, Laravel broadcasting system and Redis to prepare **Laravel Wave** and make it available for everyone. Since of February 24, unfortunately I haven't any commercial work, permanent living place or the ability to plan anything for the long term. However, I have a greater desire to continue creating useful solutions for people around the world. It makes me feel better these days.

[![support me](https://raw.githubusercontent.com/slavarazum/slavarazum/main/support-banner.png)](https://github.com/sponsors/qruto)

[GitHub Sponsorships profile](https://github.com/sponsors/qruto) is ready! There you can find current work, future plans, goals and dreams... Your stars make me happier each day ✨ Sponsorship will enable us to live more peacefully and continue to work on useful solutions for you.

I would be very grateful for mentions or just a sincere "thank you".

💳 [Sponsoring directly to savings jar](https://send.monobank.ua/jar/3eG4Vafvzq) with **card** or **Apple Pay**/**Google Pay**.

## Documentation

Refer to the [Main Readme](https://github.com/qruto/laravel-wave#introduction)
for comprehensive documentation and Laravel's Broadcasting [guidelines](https://laravel.com/docs/9.x/broadcasting).

## Usage

### 1. With Laravel Echo

Import `WaveConnector` and set it as Echo's broadcaster:

```javascript
import Echo from 'laravel-echo';

import { WaveConnector } from 'laravel-wave';

window.Echo = new Echo({ broadcaster: WaveConnector });
```

In a fresh Laravel application, replace the Echo connection configuration in **resources/js/bootstrap.js** with the snippet above.
Now, you can use Echo as normal.

<details>
    <summary>Show diff</summary>

```diff
- import Echo from 'laravel-echo';

- import Pusher from 'pusher-js';
- window.Pusher = Pusher;

- window.Echo = new Echo({
-     broadcaster: 'pusher',
-     key: import.meta.env.VITE_PUSHER_APP_KEY,
-     wsHost: import.meta.env.VITE_PUSHER_HOST ?? `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
-     wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
-     wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
-     forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
-     enabledTransports: ['ws', 'wss'],
- });
+ import Echo from 'laravel-echo';

+ import { WaveConnector } from 'laravel-wave';

+ window.Echo = new Echo({ broadcaster: WaveConnector });
```

</details>

📞 [Receiving Broadcasts](https://laravel.com/docs/9.x/broadcasting#receiving-broadcasts)

### 2. Live Eloquent Models

With native conventions of [Model Events Broadcasting](https://laravel.com/docs/8.x/broadcasting#model-broadcasting)
and [Broadcast Notifications](https://laravel.com/docs/8.x/notifications#broadcast-notifications)
use Wave models to listen for predefined events.

```javascript
import Wave from 'laravel-wave';

window.Wave = new Wave();

wave.model('User', '1')
    .notification('team.invite', (notification) => {
        console.log(notification);
    })
    .updated((user) => console.log('user updated', user))
    .deleted((user) => console.log('user deleted', user))
    .trashed((user) => console.log('user trashed', user))
    .restored((user) => console.log('user restored', user))
    .updated('Team', (team) => console.log('team updated', team));
```

Pass the model name and key to `model` to start listening.
By default, Wave uses `App.Models` as the namespace prefix, but you can override it:

```javascript
window.Wave = new Wave({ namespace: 'App.Path.Models' });
```

### Configuration Options

These options can be passed to the `Wave` or `Echo` instance:

| Name          | Type                                                                           | Default                 | Description                                                                    |
|---------------|--------------------------------------------------------------------------------|-------------------------|--------------------------------------------------------------------------------|
| endpoint      | _string_                                                                       | `/wave`                 | Primary SSE connection route.                                                  |
| namespace     | _string_                                                                       | `App.Events`            | Namespace of events to listen for.                                             |
| auth.headers  | _object_                                                                       | `{}`                    | Additional authentication headers.                                             |
| authEndpoint  | _string?_                                                                      | `/broadcasting/auth`    | Authentication endpoint.                                                       |
| csrfToken     | _string?_                                                                      | `undefined` or `string` | CSRF token, defaults from `XSRF-TOKEN` cookie.                                 |
| bearerToken   | _string?_                                                                      | `undefined`             | Bearer tokenfor authentication.                                                |
| request       | _[Request](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request)?_ | `undefined`             | Custom settings for connection and authentication requests.                    |
| pauseInactive | _boolean_                                                                      | `false`                 | If `true`, closes connection when the page is hidden and reopens when visible. |

[Main Readme](https://github.com/qruto/laravel-wave#introduction) – find full documentation here.

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for recent updates.

## Contributing

Thank you for your contribution, we're making progress together! Please see [CONTRIBUTING](https://github.com/qruto/.github/blob/main/CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

+ [Slava Razum](https://github.com/slavarazum)
+ [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
