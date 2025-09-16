import { DataSourceRepository } from "../../../data-sources/repositories"
import {
  DetectTargetInputDto,
  DetectTargetOutputDto,
  DetectTargetRepository,
} from "../../domain/repositories/detect-target.repository"

export class DrizzleDetectTargetRepository implements DetectTargetRepository {
  // TODO: 別フェーズの作業で、外部featureに依存しないように修正する
  private dataSourceRepository: DataSourceRepository =
    new DataSourceRepository()

  constructor() {}

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
