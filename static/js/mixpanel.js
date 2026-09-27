// Mixpanel analytics. Only included in production builds (ENABLE_ANALYTICS=true).
//
// The SDK is served from our own origin (see vendor-mixpanel.mjs) and its API
// is reached through the same-origin /mp/* proxy defined in netlify.toml.
// Loading either straight from *.mixpanel.com / cdn.mxpnl.com gets blocked by
// Firefox's Enhanced Tracking Protection and by ad blockers, which logged a
// CORS error on every page (issue #125).
import mixpanel from './vendor/mixpanel-browser.min.js';

mixpanel.init('04eaf7b10f676ae6014416d3bb1486ec', {
  // Proxied by Netlify to https://api-eu.mixpanel.com (EU data residency).
  api_host: '/mp',
  autocapture: true,
  disable_persistence: true,
});
