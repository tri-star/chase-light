import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
// import { context, propagation, SpanKind, trace } from '@opentelemetry/api'
import { createMiddleware } from 'hono/factory'

export const otlpMiddleware = createMiddleware<AppContext>(async (c, next) => {
  // _X_AMZN_TRACE_ID  Root=1-67b8ac15-4a9950272235fb671129bc6b;Parent=722a02e746cff02d;Sampled=1;Lineage=1:cb371678:0
  // const textMapGetter = {
  //   keys: (carrer: object) => Object.keys(carrer),
  //   get: (
  //     carrier: Record<string, string | string[] | undefined>,
  //     key: string,
  //   ) => carrier[key],
  // }
  console.log('request headers', c.req.raw.headers)
  // const span = trace.getTracer('API').startSpan(
  //   'API',
  //   {
  //     kind: SpanKind.SERVER,
  //   },
  //   propagation.extract(context.active(), c.req.raw.headers),
  // )
  // await context.with(trace.setSpan(context.active(), span), async () => {
  await next()
  // })
  // span.end()
})
