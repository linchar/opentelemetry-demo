// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8163b764efcca3d682d28fc8b1540210@o465684.ingest.us.sentry.io/4508876544278529",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
