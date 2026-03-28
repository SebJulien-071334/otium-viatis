export const config = {
  runtime: 'edge',
}

const TAM_CSV_URL =
  'https://data.montpellier3m.fr/sites/default/files/ressources/TAM_MMM_TpsReel.csv'

export default async function handler(_req: Request): Promise<Response> {
  const response = await fetch(TAM_CSV_URL, {
    headers: { Accept: 'text/csv, text/plain' },
  })

  const text = await response.text()

  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
