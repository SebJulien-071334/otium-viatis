import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/navitia', ({ request }) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path') ?? ''

    if (path === 'places') {
      return HttpResponse.json({
        places: [
          {
            id: 'stop_area:TAM:SA:001',
            name: 'Place de la Comédie',
            embedded_type: 'stop_area',
            stop_area: {
              id: 'stop_area:TAM:SA:001',
              name: 'Place de la Comédie',
              label: 'Place de la Comédie',
              timezone: 'Europe/Paris',
              coord: { lat: '43.608', lon: '3.879' },
            },
          },
        ],
        links: [],
      })
    }

    if (path === 'journeys') {
      return HttpResponse.json({ journeys: [], links: [] })
    }

    return HttpResponse.json({ error: { id: 'unknown_path', message: 'Not found' } }, { status: 404 })
  }),

  http.get('/api/realtime', () => {
    const csv = [
      'col0;col1;col2;stop_name;route;headsign;dir;time;is_theo',
      ';;;Place de la Comédie;1;Mosson;0;14:30:00;0',
      ';;;Place de la Comédie;1;Mosson;0;14:40:00;1',
      ';;;Place de la Comédie;2;Jacou;0;14:35:00;0',
    ].join('\n')
    return new HttpResponse(csv, {
      headers: { 'Content-Type': 'text/csv' },
    })
  }),
]
