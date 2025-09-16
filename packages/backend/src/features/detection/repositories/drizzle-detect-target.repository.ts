import { DataSourceRepository } from "../../data-sources/repositories/data-source.repository"
import {
  DetectTargetInputDto,
  DetectTargetOutputDto,
  DetectTargetRepository,
} from "../domain/repositories/detect-target.repository"

export class DrizzleDetectTargetRepository implements DetectTargetRepository {
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
