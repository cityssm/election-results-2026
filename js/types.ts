type IdValue = `${number}`

/** yyyy-mm-dd hh:mm:ss */
type TimestampValue =
  `${number}-${number}-${number} ${number}:${number}:${number}`

type PercentageValue = `${number}.${number}%`

type BooleanNumberValue = 0 | 1

export interface AreaResultsJson {
  statistics: Statistics & {
    official: string
    projectName: string

    /** The date and time the results were recorded in yyyy-mm-dd hh:mm:ss format */
    timeStamp: TimestampValue

    /** Formatted percentage of voter turnout */
    globTurnout: PercentageValue

    /** The total number of ballots cast */
    globBallotCast: number

    /** The total number of tabulators used in the election */
    globTabulators: number

    /** The total number of closed tabulators */
    globClosedTabulators: number

    globPolls: number

    globClosedPolls: number
    globStartedPolls: number

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

    polls: number

    closedPolls: number
    startedPolls: number
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
  /** Unique identifier for the contest */
  id: IdValue

  /** Title of the contest */
  contestName: string

  /** Number of positions available in the contest */
  voteFor: number

  /** Whether the contest is acclaimed */
  isAcclaimed: boolean

  /** Number of eligible voters */
  eligibleVoters: number

  /** Formatted percentage of voter turnout */
  turnout: PercentageValue

  /** Total number of ballots cast */
  ballotCast: number

  /** Preferred sort order */
  sort: number

  /** Array of candidate results for the contest */
  choiceResults: Array<{
    /** Unique identifier for the candidate */
    id: IdValue

    /** Candidate name */
    choiceName: string

    /** Number of votes received */
    votes: number

    /** Percentage of votes received */
    percentage: PercentageValue

    /** Whether the candidate is an incumbent */
    isIncumbent: BooleanNumberValue

    /** Whether the candidate is disabled */
    isDisabled: BooleanNumberValue

    /** The gender of the candidate */
    gender: string

    /** Whether the candidate is the winner of the contest */
    isWinner: BooleanNumberValue

    partyBreakdown: unknown[]
  }>
}
