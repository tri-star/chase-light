import type StepFunctions from 'serverless-step-functions'

declare module 'serverless/aws' {
  interface Serverless {
    stepFunctions?: StepFunctions
  }
}
