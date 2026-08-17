type PercentageValue = `${number}.${number}%`

type BooleanNumberValue = 0 | 1

export type AreaListJson = Area[]

export interface Area {
  id: string
  areaName: string
  sort: number
  hasContests: boolean
  areaTypeId: string
  parentAreaId: string
}

export type AreaTypeJson = AreaType[]

export interface AreaType {
  id: string
  areaType: string
  hasContests: string
  showByDefault: string

  /** Lower case property name */
  parentid: string
}

interface Statistics {
  eligibleVoters: number

  /** Lower case property name */
  countinggroups: Array<{
    countingGroupId: string
    countingGroupName: string
    tabulators: number
    closedTabulators: number
  }>
}

export interface AreaResults {
  statistics: Statistics & {
    turnout: PercentageValue
    turnout2: PercentageValue

    ballotCast: number
    ballotCast2: number

    tabulators: number
    closedTabulators: number

    startedPolls: number
    polls: number
    closedPolls: number
  }

  contestResults: Array<{
    id: string
    contestName: string
    voteFor: number
    isAcclaimed: boolean
    eligibleVoters: number
    turnout: PercentageValue
    ballotCast: number
    sort: number

    choiceResults: Array<{
      id: string
      choiceName: string
      votes: number
      percentage: PercentageValue
      isIncumbent: BooleanNumberValue
      isDisabled: BooleanNumberValue
      gender: string
      isWinner: BooleanNumberValue
      partyBreakdown: unknown[]
    }>
  }>
}

export interface AreaResultsJson {
  statistics: Statistics & {
    projectName: string
    official: string

    /** yyyy-mm-dd hh:mm:ss */
    timeStamp: `${number}-${number}-${number} ${number}:${number}:${number}`

    globTurnout: PercentageValue
    globBallotCast: number

    globTabulators: number
    globClosedTabulators: number

    globStartedPolls: number
    globPolls: number
    globClosedPolls: number

    partyStats: unknown[]
  }

  areaResults: Array<Record<Area['id'], AreaResults>>
}
