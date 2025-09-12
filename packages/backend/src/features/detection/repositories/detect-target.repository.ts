import { DataSourceRepository } from "../../data-sources/repositories/data-source.repository"
import type { DataSource } from "../../data-sources/domain"

export type DetectTargetInputDto = {
  sourceType?: string
}

export type DetectTargetOutputDto = {
  dataSources: DataSource[]
}

export class DetectTargetRepository {
  constructor(private dataSourceRepository: DataSourceRepository) {}

  async listDetectTargets(
    input: DetectTargetInputDto,
  ): Promise<DetectTargetOutputDto> {
    const dataSources = await this.dataSourceRepository.findMany({
      sourceType: input.sourceType,
    })

    return {
      dataSources,
    }
  }
}
