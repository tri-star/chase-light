type SqsConfig = {
  translationQueueUrl: string
  region: string
  endpoint?: string
}

export function getSqsConfig(): SqsConfig {
  const translationQueueUrl = process.env.TRANSLATION_QUEUE_URL
  const region = process.env.AWS_REGION || "ap-northeast-1"
  const endpoint = process.env.SQS_ENDPOINT

  if (!translationQueueUrl) {
    throw new Error("TRANSLATION_QUEUE_URL is not defined")
  }

  return {
    translationQueueUrl,
    region,
    endpoint,
  }
}
