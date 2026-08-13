import { http, HttpResponse } from 'msw'

interface BinaryBody {
  a: number
  b: number
}

export const handlers = [
  http.post('/api/v1/add', async ({ request }) => {
    const { a, b } = (await request.json()) as BinaryBody
    return HttpResponse.json({ result: a + b })
  }),
  http.post('/api/v1/subtract', async ({ request }) => {
    const { a, b } = (await request.json()) as BinaryBody
    return HttpResponse.json({ result: a - b })
  }),
  http.post('/api/v1/multiply', async ({ request }) => {
    const { a, b } = (await request.json()) as BinaryBody
    return HttpResponse.json({ result: a * b })
  }),
  http.post('/api/v1/divide', async ({ request }) => {
    const { a, b } = (await request.json()) as BinaryBody
    if (b === 0) {
      return HttpResponse.json({ error: 'division by zero' }, { status: 422 })
    }
    return HttpResponse.json({ result: a / b })
  }),
  http.post('/api/v1/power', async ({ request }) => {
    const { base, exponent } = (await request.json()) as { base: number; exponent: number }
    return HttpResponse.json({ result: Math.pow(base, exponent) })
  }),
  http.post('/api/v1/sqrt', async ({ request }) => {
    const { a } = (await request.json()) as { a: number }
    if (a < 0) {
      return HttpResponse.json(
        { error: 'cannot take square root of a negative number' },
        { status: 422 },
      )
    }
    return HttpResponse.json({ result: Math.sqrt(a) })
  }),
  http.post('/api/v1/percentage', async ({ request }) => {
    const { a, b } = (await request.json()) as BinaryBody
    return HttpResponse.json({ result: (a / 100) * b })
  }),
]
