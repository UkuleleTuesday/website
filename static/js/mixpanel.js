import mixpanel from 'mixpanel-browser';

mixpanel.init('04eaf7b10f676ae6014416d3bb1486ec', {
  api_host: 'https://api-eu.mixpanel.com',
  autocapture: true,
  disable_persistence: true,
});
