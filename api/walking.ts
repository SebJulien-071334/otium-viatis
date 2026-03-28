export const config = {
  runtime: 'edge',
}

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking'

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const userLat = url.searchParams.get('userLat')
  const userLon = url.searchParams.get('userLon')
  const stopLat = url.searchParams.get('stopLat')
  const stopLon = url.searchParams.get('stopLon')

  if (!userLat || !userLon || !stopLat || !stopLon) {
    return new Response(JSON.stringify({ error: 'Missing params' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const orsUrl = `${ORS_URL}?start=${userLon},${userLat}&end=${stopLon},${stopLat}`

  const res = await fetch(orsUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'ORS error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = (await res.json()) as {
    features: Array<{
      properties: {
        summary: { distance: number; duration: number }
      }
    }>
  }

  const summary = data.features?.[0]?.properties?.summary
  if (!summary) {
    return new Response(JSON.stringify({ error: 'No route found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      durationSeconds: Math.round(summary.duration),
      distanceMeters: Math.round(summary.distance),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60',
      },
    }
  )
}
