import { SpanKind, trace } from '@opentelemetry/api'
import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import { handle } from 'hono/aws-lambda'

let prismaClient: PrismaClient | undefined
const getQueryWithParams = (query: string, params: string[]) => {
  let i = 1
  while (query.indexOf('$') >= 0) {
    query = query.replace(
      query[query.indexOf('$')] + query[query.indexOf('$') + 1],
      `"${params[i - 1]}"`,
    )
    i++
  }
  return query
}

export function getPrismaClientInstance() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleQuery(event: Record<string, any>) {
      // const currentSpanContext = trace.setSpan(
      //   context.active(),
      //   trace.getActiveSpan()!,
      // )

      const startTime = new Date(event.timestamp)
      const endTime = dayjs(event.timestamp.valueOf())
        .add(event.duration, 'ms')
        .toDate()

      const span = trace.getTracer('prisma').startSpan(
        'Prisma',
        {
          startTime,
          kind: SpanKind.INTERNAL,
        },
        // currentSpanContext,
      )
      const query = getQueryWithParams(event.query, JSON.parse(event.params))
      // console.dir(query, { depth: 10 })
      // console.log(span)
      span.addEvent('query', {
        query,
      })
      span.setAttribute('query', query)
      span.setAttribute('duraiton', event.duration)
      span.end(endTime)
    }
    // @ts-expect-error なぜか、'query'イベント名の型がneverとなってしまう
    prismaClient.$on('query', handleQuery)
  }
  return prismaClient
}

export function swapPrismaClientForTest(newPrismaClient: PrismaClient) {
  prismaClient = newPrismaClient
}
