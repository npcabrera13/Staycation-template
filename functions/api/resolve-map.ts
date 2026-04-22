export const onRequestGet: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const mapUrl = url.searchParams.get('url');

  if (!mapUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Follow the redirect to get the full Google Maps URL
    const response = await fetch(mapUrl, { redirect: 'follow' });
    const finalUrl = response.url;

    // Try to extract the place name from the URL
    // Format is typically: https://www.google.com/maps/place/Name+Of+Place/@coords...
    let placeName = '';
    const placeMatch = finalUrl.match(/\/maps\/place\/([^\/]+)/);
    
    let embedUrl = '';
    if (placeMatch && placeMatch[1]) {
      placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    } else {
      // Fallback: Just pass the final URL as the search query
      embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(finalUrl)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      originalUrl: mapUrl,
      finalUrl: finalUrl,
      placeName: placeName,
      embedUrl: embedUrl
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to resolve map URL', details: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
