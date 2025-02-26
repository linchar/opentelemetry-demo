// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5774677ae1e3eb82d9f09c0085382b1f@o4507884842254336.ingest.us.sentry.io/4508887931092992",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
