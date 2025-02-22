import opentelemetry from '@opentelemetry/sdk-node'
import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import {
  context,
  trace,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  propagation,
  SpanKind,
  SpanStatusCode,
} from '@opentelemetry/api'
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
// import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray'
import { AWSXRayLambdaPropagator } from '@opentelemetry/propagator-aws-xray-lambda'
import { createMiddleware } from 'hono/factory'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { AwsLambdaInstrumentation } from '@opentelemetry/instrumentation-aws-lambda'

// const sdkInitialized = false

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

const _resource = Resource.default().merge(
  new Resource({
    [ATTR_SERVICE_NAME]: 'chase-light-api',
  }),
)

const _traceExporter = new OTLPTraceExporter()
const _spanProcessor = new BatchSpanProcessor(_traceExporter, {})

let sdk: opentelemetry.NodeSDK | undefined = undefined

export const otlpMiddleware = createMiddleware<AppContext>(async (c, next) => {
  if (sdk == null) {
    sdk = new opentelemetry.NodeSDK({
      textMapPropagator: new AWSXRayLambdaPropagator(),
      instrumentations: [
        new HttpInstrumentation(),
        new UndiciInstrumentation(),
        new AwsLambdaInstrumentation(),
      ],
      resource: _resource,
      spanProcessor: _spanProcessor,
      traceExporter: _traceExporter,
      idGenerator: new AWSXRayIdGenerator(),
      spanProcessors: [new BatchSpanProcessor(_traceExporter)],
    })
  }
  sdk.start()

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk
      ?.shutdown()
      .then(() => console.log('Tracing and Metrics terminated'))
      .catch((error) =>
        console.log('Error terminating tracing and metrics', error),
      )
      .finally(() => process.exit(0))
  })

  // _X_AMZN_TRACE_ID  Root=1-67b8ac15-4a9950272235fb671129bc6b;Parent=722a02e746cff02d;Sampled=1;Lineage=1:cb371678:0
  const textMapGetter = {
    keys: (carrer: object) => Object.keys(carrer),
    get: (
      carrier: Record<string, string | string[] | undefined>,
      key: string,
    ) => carrier[key],
  }
  const newContext = propagation.extract(
    context.active(),
    c.req.raw.headers,
    textMapGetter,
  )
  await trace.getTracer('API').startActiveSpan(
    'API',
    {
      kind: SpanKind.SERVER,
    },
    newContext,
    async (span) => {
      try {
        console.log(span.spanContext())
        await next()
      } catch (e) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: JSON.stringify(e),
        })
        throw e
      } finally {
        span.end()
      }
    },
  )
})
