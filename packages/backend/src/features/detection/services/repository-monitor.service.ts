import { DataSourceRepository } from "../../data-sources/repositories/data-source.repository"
import type { DataSource } from "../../data-sources/domain"

export type MonitoringDataSourceInputDto = {
  sourceType?: string
}

export type MonitoringDataSourceOutputDto = {
  dataSources: DataSource[]
}

export class RepositoryMonitorService {
  constructor(private dataSourceRepository: DataSourceRepository) {}

  async getMonitoringDataSources(
    input: MonitoringDataSourceInputDto,
  ): Promise<MonitoringDataSourceOutputDto> {
    const dataSources = await this.dataSourceRepository.findMany({
      sourceType: input.sourceType,
    })

    return {
      dataSources,
    }
  }
}
