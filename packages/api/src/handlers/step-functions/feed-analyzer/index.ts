import type StateMachine from 'serverless-step-functions'
import { listFeedHandler } from '@/handlers/step-functions/feed-analyzer/handlers/list-feed-handler'
import { createFeedLogsHandler } from '@/handlers/step-functions/feed-analyzer/handlers/create-feed-logs'
import { enqueuePendingFeedLogHandler } from '@/handlers/step-functions/feed-analyzer/handlers/enqueue-pending-feed-log-handler'
import { analyzeFeedLogHandler } from '@/handlers/step-functions/feed-analyzer/handlers/analyze-feed-log-handler'
import { notifyUpdateHandler } from '@/handlers/step-functions/feed-analyzer/handlers/notify-update-handler'

export const feedAnalyzerStateMachine: StateMachine['stateMachines'][number] = {
  tracingConfig: {
    enabled: true,
  },
  definition: {
    StartAt: 'ListFeeds',
    QueryLanguage: 'JSONata',
    States: {
      ListFeeds: {
        Type: 'Task',
        Resource: {
          'Fn::GetAtt': ['feedAnalyzer-listFeedHandler', 'Arn'],
        },
        Assign: {
          feedIdList: '{% $states.result.feedIds %}',
        },
        Next: 'CreateFeedLogCollections',
      },
      CreateFeedLogCollections: {
        Type: 'Map',
        Items: '{% $feedIdList %}',
        MaxConcurrency: 3,
        ItemProcessor: {
          StartAt: 'CreateFeedLogs',
          States: {
            CreateFeedLogs: {
              Type: 'Task',
              Resource: {
                'Fn::GetAtt': ['feedAnalyzer-createFeedLogsHandler', 'Arn'],
              },
              Assign: {
                feedLogs: '{% $states.result %}',
              },
              Catch: [
                {
                  ErrorEquals: ['States.ALL'],
                  Assign: {
                    errorDetail: '{% $states.errorOutput %}',
                  },
                  Next: 'Error',
                },
              ],
              End: true,
            },
            Error: {
              Type: 'Pass',
              Output: {
                error: '{% $errorDetail %}',
              },
              End: true,
            },
          },
        },
        Next: 'EnqueuePendingFeedLog',
      },
      EnqueuePendingFeedLog: {
        Type: 'Task',
        Resource: {
          'Fn::GetAtt': ['feedAnalyzer-enqueuePendingFeedLogHandler', 'Arn'],
        },
        Next: 'NotifyUpdate',
      },
      NotifyUpdate: {
        Type: 'Task',
        Resource: {
          'Fn::GetAtt': ['feedAnalyzer-notifyUpdateHandler', 'Arn'],
        },
        End: true,
      },
    },
  },
}

export const feedAnalyzerHandlers = {
  listFeedHandler,
  createFeedLogsHandler,
  enqueuePendingFeedLogHandler,
  analyzeFeedLogHandler,
  notifyUpdateHandler,
}
