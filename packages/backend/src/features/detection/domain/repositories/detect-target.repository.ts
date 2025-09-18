import { DetectTarget } from "../detect-target"

export type DetectTargetInputDto = {
  sourceType?: string
}

export type DetectTargetOutputDto = {
  detectTargets: DetectTarget[]
}

export interface DetectTargetRepository {
  listDetectTargets(input: DetectTargetInputDto): Promise<DetectTargetOutputDto>

  findById(id: string): Promise<DetectTarget | null>
}
