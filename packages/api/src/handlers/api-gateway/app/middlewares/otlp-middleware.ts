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

export const otlpMiddleware = createMiddleware<AppContext>(async (c, next) => {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

  const _resource = Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: 'chase-light-api',
    }),
  )

  const _traceExporter = new OTLPTraceExporter()
  const _spanProcessor = new BatchSpanProcessor(_traceExporter, {})

  const sdk = new opentelemetry.NodeSDK({
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

  // this enables the API to record telemetry
  sdk.start()

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing and Metrics terminated'))
      .catch((error) =>
        console.log('Error terminating tracing and metrics', error),
      )
      .finally(() => process.exit(0))
  })

  console.log(process.env)
  const textMapGetter = {
    keys: (carrer: object) => Object.keys(carrer),
    get: (
      carrier: Record<string, string | string[] | undefined>,
      key: string,
    ) => carrier[key],
  }
  const newContext = propagation.extract(
    context.active(),
    process.env,
    textMapGetter,
  )
  console.log('new context', newContext)
  await trace.getTracer('API').startActiveSpan(
    'API',
    {
      kind: SpanKind.SERVER,
    },
    newContext,
    async (span) => {
      try {
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
