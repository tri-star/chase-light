import { URL } from "url"
import { config } from "dotenv"
import { getSsmParameterValue } from "./ssm-parameter"

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
    console.error("Error parsing PostgreSQL URL:", error) // Log the full error securely
    throw new Error("Invalid PostgreSQL URL format.") // Throw a sanitized error message
  }
}

export const getDatabaseConfig = async () => {
  // Load environment variables
  if (process.env.NODE_ENV === "test") {
    config({ path: ".env.testing" })
  } else {
    config()
  }

  const isAWSEnvironment = process.env.USE_AWS === "true"

  if (isAWSEnvironment) {
    const awsRegion = process.env.AWS_REGION
    const stage = process.env.APP_STAGE

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

    const parameterName = `/${stage}-chase-light/supabase/db_url`
    const dbUrl = await getSsmParameterValue(parameterName, {
      withDecryption: true,
    })

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
