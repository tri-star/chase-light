export type DigestUserState = {
  userId: string
  lastSuccessfulRunAt: Date | null
  lastAttemptedRunAt: Date | null
  timezone: string
}

export type FetchDigestUserStatesParams = {
  limit: number
}

export type UpdateDigestUserStateInput = {
  userId: string
  lastSuccessfulRunAt: Date | null
  lastAttemptedRunAt: Date
}

export interface DigestUserStateRepository {
  fetchUserStates(
    params: FetchDigestUserStatesParams,
  ): Promise<DigestUserState[]>
  updateUserStates(updates: UpdateDigestUserStateInput[]): Promise<void>
}
