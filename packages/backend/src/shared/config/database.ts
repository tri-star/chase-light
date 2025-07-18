import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"

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

export const getDatabaseConfig = async () => {
  const isAWSEnvironment = process.env.USE_AWS === "true"

  if (isAWSEnvironment) {
    const ssmClient = new SSMClient({ region: process.env.AWS_REGION })
    const parameterBasePath =
      process.env.PARAMETER_STORE_BASE_PATH || "/chase-light/database"

    const [host, port, name, user, password] = await Promise.all([
      getParameter(ssmClient, `${parameterBasePath}/host`),
      getParameter(ssmClient, `${parameterBasePath}/port`),
      getParameter(ssmClient, `${parameterBasePath}/name`),
      getParameter(ssmClient, `${parameterBasePath}/user`),
      getParameter(ssmClient, `${parameterBasePath}/password`, true),
    ])

    return { host, port, name, user, password }
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
