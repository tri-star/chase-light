import type { DigestCandidate, DigestWindow } from "../digest"

export type DigestUserWindow = {
  userId: string
  window: DigestWindow
}

export type FindDigestCandidatesParams = {
  userWindows: DigestUserWindow[]
  maxEntriesPerGroup: number
}

export interface DigestPreparationRepository {
  findCandidates(params: FindDigestCandidatesParams): Promise<DigestCandidate[]>
}
