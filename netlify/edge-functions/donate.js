export default async (request, context) => {
  // This edge function handles both /donate and /donate-qr redirects
  // Access environment variables in Edge Functions
  const bmcUrl = Deno.env.get('BMC_URL') || 'https://buymeacoffee.com/ukuleletuesday';
  const defaultUtms = Deno.env.get('BMC_DEFAULT_UTMS') || 'utm_source=screen&utm_medium=qr&utm_campaign=donate';
  
  // Extract UTM parameters from the request URL
  const url = new URL(request.url);
  
  // Log function invocation
  console.log(`[donate] Function invoked for URL: ${url.href}`);
  const utmParams = new URLSearchParams();
  
  // Check if there are any incoming UTM parameters
  let hasIncomingUtms = false;
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  for (const key of utmKeys) {
    if (url.searchParams.has(key)) {
      utmParams.set(key, url.searchParams.get(key));
      hasIncomingUtms = true;
    }
  }
  
  // If no incoming UTMs, use defaults
  if (!hasIncomingUtms) {
    const defaults = new URLSearchParams(defaultUtms);
    for (const [key, value] of defaults) {
      utmParams.set(key, value);
    }
    console.log(`[donate] No incoming UTM parameters, using defaults: ${defaultUtms}`);
  } else {
    console.log(`[donate] Using incoming UTM parameters: ${utmParams.toString()}`);
  }
  
  // Build the final redirect URL
  const redirectUrl = new URL(bmcUrl);
  for (const [key, value] of utmParams) {
    redirectUrl.searchParams.set(key, value);
  }
  
  console.log(`[donate] Final redirect URL: ${redirectUrl.href}`);
  
  // Send Mixpanel event to EU endpoint
  const mixpanelToken = '04eaf7b10f676ae6014416d3bb1486ec';
  const mixpanelEvent = {
    event: 'Donate link opened',
    properties: {
      distinct_id: crypto.randomUUID(),
      time: Date.now(),
      $insert_id: crypto.randomUUID(),
      utm_source: utmParams.get('utm_source'),
      utm_medium: utmParams.get('utm_medium'),
      utm_campaign: utmParams.get('utm_campaign'),
      utm_term: utmParams.get('utm_term'),
      utm_content: utmParams.get('utm_content'),
      user_agent: request.headers.get('user-agent'),
      ip: context.ip,
      referrer: request.headers.get('referer'),
    }
  };
  
  // Send to Mixpanel Import API (EU endpoint)
  try {
    // Create Basic Auth header with token as username and empty password
    const authHeader = 'Basic ' + btoa(mixpanelToken + ':');
    
    const mixpanelResponse = await fetch('https://api-eu.mixpanel.com/import?strict=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify([mixpanelEvent]),
    });
    
    // Log response for debugging (optional - will appear in Netlify function logs)
    if (!mixpanelResponse.ok) {
      console.warn(`[donate] Mixpanel import failed: ${mixpanelResponse.status} ${await mixpanelResponse.text()}`);
    } else {
      console.log(`[donate] Mixpanel event sent successfully: ${mixpanelEvent.event}`);
    }
  } catch (error) {
    console.error(`[donate] Error sending Mixpanel event: ${error.message}`);
    // Continue with redirect even if Mixpanel fails
  }
  
  // Return 302 redirect to BuyMeACoffee
  console.log(`[donate] Redirecting to: ${redirectUrl.href}`);
  return Response.redirect(redirectUrl.toString(), 302);
};