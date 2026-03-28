export const config = {
  runtime: 'edge',
}

const NAVITIA_BASE = 'https://api.navitia.io/v1/coverage/fr-mpt'

export default async function handler(req: Request): Promise<Response> {
  const apiKey = process.env.NAVITIA_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const path = url.searchParams.get('path')
  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const forwardedParams = new URLSearchParams()
  url.searchParams.forEach((value, key) => {
    if (key !== 'path') forwardedParams.append(key, value)
  })

  const query = forwardedParams.toString()
  const targetUrl = `${NAVITIA_BASE}/${path}${query ? `?${query}` : ''}`

  const encoded = btoa(`${apiKey}:`)

  const response = await fetch(targetUrl, {
    headers: {
      Authorization: `Basic ${encoded}`,
      Accept: 'application/json',
    },
  })

  const text = await response.text()

  return new Response(text, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
