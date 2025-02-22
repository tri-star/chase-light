const opentelemetry = require('@opentelemetry/sdk-node')
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api')

const { AWSXRayIdGenerator } = require('@opentelemetry/id-generator-aws-xray')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const {
  AWSXRayLambdaPropagator,
} = require('@opentelemetry/propagator-aws-xray-lambda')
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base')
const { Resource } = require('@opentelemetry/resources')
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')
const {
  UndiciInstrumentation,
} = require('@opentelemetry/instrumentation-undici')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
const {
  AwsLambdaInstrumentation,
} = require('@opentelemetry/instrumentation-aws-lambda')

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
