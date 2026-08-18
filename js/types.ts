type IdValue = `${number}`

type TimestampValue =
  `${number}-${number}-${number} ${number}:${number}:${number}`

type PercentageValue = `${number}.${number}%`

type BooleanNumberValue = 0 | 1

export interface AreaResultsJson {
  statistics: Statistics & {
    projectName: string
    official: string

    /** yyyy-mm-dd hh:mm:ss */
    timeStamp: TimestampValue

    globTurnout: PercentageValue
    globBallotCast: number

    globTabulators: number
    globClosedTabulators: number

    globStartedPolls: number
    globPolls: number
    globClosedPolls: number

    partyStats: unknown[]
  }

  areaResults: Array<Record<IdValue, AreaResults>>
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

  contestResults: ContestResult[]
}

interface Statistics {
  eligibleVoters: number

  /** Lower case property name */
  countinggroups: Array<{
    countingGroupId: IdValue
    countingGroupName: string
    tabulators: number
    closedTabulators: number
  }>
}

export interface ContestResult {
  id: IdValue
  contestName: string
  voteFor: number
  isAcclaimed: boolean
  eligibleVoters: number
  turnout: PercentageValue
  ballotCast: number
  sort: number

  choiceResults: Array<{
    id: IdValue
    choiceName: string
    votes: number
    percentage: PercentageValue
    isIncumbent: BooleanNumberValue
    isDisabled: BooleanNumberValue
    gender: string
    isWinner: BooleanNumberValue
    partyBreakdown: unknown[]
  }>
}
