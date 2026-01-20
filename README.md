# Away

This tool can help a collegiate ballroom dance team organize travel to other teams’ competitions.

## If you are not a software developer

You should just go to https://bbdtaway.azurewebsites.net/. It uses free web hosting, so it is not unusual for the page
to take a minute to load; just be patient.

If you are a software developer, read on.

## Running this application

To run this application fully from your local machine:

1. If you have not already, install [node.js](https://nodejs.org/), perhaps via the
   [Node Version Manager](https://github.com/nvm-sh/nvm). This was tested with Node 24 LTS.
2. Clone this repository and `cd` into it.
3. Run `npm install`.
4. Run `npm start`.

## Running tests

You can run unit tests with `npm run test`.

## Building this application

Before deploying this app, you may want to run the built version to see whether everything still behaves as expected:

1. Run `npm run build` to build this application.
2. Run `npm run build-serve` to start a server that serves the built version.

If you access the app via the same host (i.e. http://localhost:3000/) with both `npm start` and `npm run build-serve`,
the [service worker](https://developer.chrome.com/docs/workbox/) may interfere with some functions. For example, changes
that you made to the source code might not take effect, even when you reload the page, or [the logo](src/logo.svg) might
be replaced with the icon of a broken image. If this happens, unregistering the service worker and reloading the page
may help; see [Chrome for Developers](https://developer.chrome.com/docs/devtools/progressive-web-apps#service-workers)
for instructions.

## Automatically fixing linter errors and warnings

Some linter errors can be fixed automatically; just run `npm run lint-fix`. You can also run the linter without building
or fixing errors automatically with `npm run lint`.
