import type StateMachine from 'serverless-step-functions'
import { listFeedHandler } from '@/handlers/step-functions/feed-analyzer/handlers/list-feed-handler'

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
          'Fn::GetAtt': ['feedAnalyzer_listFeedHandler', 'Arn'],
        },
        Assign: {
          feedList: '{% $states.result %}',
        },
        End: true,
      },
    },
  },
}

export const feedAnalyzerHandlers = {
  listFeedHandler,
}
