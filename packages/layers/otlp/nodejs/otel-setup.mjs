// https://github.com/open-telemetry/opentelemetry-js/issues/4933
import { register } from 'module'
import { createAddHookMessageChannel } from 'import-in-the-middle'

import opentelemetry from '@opentelemetry/sdk-node'
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  trace,
} from '@opentelemetry/api'

import { AWSXRayLambdaPropagator } from '@opentelemetry/propagator-aws-xray-lambda'
import {
  // BatchSpanProcessor,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { AwsLambdaInstrumentation } from '@opentelemetry/instrumentation-aws-lambda'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'

const { registerOptions, waitForAllMessagesAcknowledged } =
  createAddHookMessageChannel()
register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions)

console.info('START OTEL SETUP')

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

const _resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.ATTR_SERVICE_NAME || 'chase-light-api',
})

const _traceExporter = new OTLPTraceExporter()

const sdk = new opentelemetry.NodeSDK({
  textMapPropagator: new AWSXRayLambdaPropagator(),
  instrumentations: [
    new AwsLambdaInstrumentation(),
    new UndiciInstrumentation(),
    new HttpInstrumentation(),
    new PgInstrumentation()
  ],
  resource: _resource,
  traceExporter: _traceExporter,
  // idGenerator: new AWSXRayIdGenerator(),
  spanProcessors: [new SimpleSpanProcessor(_traceExporter)],
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

await waitForAllMessagesAcknowledged()
