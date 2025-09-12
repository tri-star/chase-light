import { DataSourceRepository } from "../../data-sources/repositories/data-source.repository"
import type { DataSource } from "../../data-sources/domain"

export type DataSourceUpdateDetectionInputDto = {
  sourceType?: string
}

export type DataSourceUpdateDetectionOutputDto = {
  dataSources: DataSource[]
}

export class DataSourceUpdateDetectionService {
  constructor(private dataSourceRepository: DataSourceRepository) {}

  async listDataSources(
    input: DataSourceUpdateDetectionInputDto,
  ): Promise<DataSourceUpdateDetectionOutputDto> {
    const dataSources = await this.dataSourceRepository.findMany({
      sourceType: input.sourceType,
    })

    return {
      dataSources,
    }
  }
}
