import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
import { URL } from "url"

const getParameter = async (
  client: SSMClient,
  name: string,
  withDecryption = false,
) => {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: withDecryption,
  })
  const response = await client.send(command)
  return response.Parameter?.Value
}

const parsePostgresqlUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    return {
      host: urlObj.hostname,
      port: urlObj.port ? Number(urlObj.port) : 5432,
      name: urlObj.pathname.substring(1), // Remove leading '/'
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
    }
  } catch (error) {
    console.error("Error parsing PostgreSQL URL:", error); // Log the full error securely
    throw new Error("Invalid PostgreSQL URL format."); // Throw a sanitized error message
  }
}

export const getDatabaseConfig = async () => {
  const isAWSEnvironment = process.env.USE_AWS === "true"

  if (isAWSEnvironment) {
    const awsRegion = process.env.AWS_REGION
    const stage = process.env.STAGE

    if (!awsRegion) {
      throw new Error(
        "AWS_REGION environment variable is required when USE_AWS is true",
      )
    }

    if (!stage) {
      throw new Error(
        "STAGE environment variable is required when USE_AWS is true",
      )
    }

    const ssmClient = new SSMClient({ region: awsRegion })
    const parameterName = `/${stage}/supabase/db_url`

    const dbUrl = await getParameter(ssmClient, parameterName, true)

    if (!dbUrl) {
      throw new Error(`Database URL parameter not found: ${parameterName}`)
    }

    return parsePostgresqlUrl(dbUrl)
  } else {
    return {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  }
}
