export type DigestUserState = {
  userId: string
  lastSuccessfulRunAt: Date | null
  lastAttemptedRunAt: Date | null
  timezone: string
}

export type FetchDigestUserStatesParams = {
  limit: number
}

export type DigestUserInitialContext = {
  userId: string
  timezone: string
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
  fetchInitialUserContexts(
    params: FetchDigestUserStatesParams,
  ): Promise<DigestUserInitialContext[]>
  updateUserStates(updates: UpdateDigestUserStateInput[]): Promise<void>
}
