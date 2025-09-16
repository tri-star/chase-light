import type { DataSource } from "../../../data-sources/domain"

export type DetectTargetInputDto = {
  sourceType?: string
}

export type DetectTargetOutputDto = {
  dataSources: DataSource[]
}

export interface DetectTargetRepository {
  listDetectTargets(input: DetectTargetInputDto): Promise<DetectTargetOutputDto>
}
