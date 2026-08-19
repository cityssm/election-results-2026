/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import type { BulmaJS } from '@cityssm/bulma-js/types.js'
import type { DOMPurify as DOMPurifyI } from 'dompurify'

import type { AreaResultsJson, ContestResult } from './types.js'

declare const bulmaJS: BulmaJS
declare const DOMPurify: DOMPurifyI

;(() => {
  const refreshMillis = 30_000
  let refreshTimeout: number | undefined

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const refreshCutoffMillis = 30 * 86_400_000

  const loopMillis = 10_000

  let areaResultsJson: AreaResultsJson | undefined

  const tabsMenuElement = document.querySelector<HTMLUListElement>('.menu-list')
  const tabsContainerElement = document.querySelector<HTMLElement>('main')

  function renderContestResults(contestResult: ContestResult): void {
    const containerElement = tabsContainerElement?.querySelector<HTMLElement>(
      `#contest-${contestResult.id}`
    )

    if (containerElement === undefined || containerElement === null) {
      return
    }

    containerElement.textContent = ''

    const contestContainerElement = document.createElement('div')

    contestContainerElement.className = 'panel'

    // eslint-disable-next-line browser-security/no-innerhtml
    contestContainerElement.innerHTML = /* html */ `
      <h2 class="panel-heading">
        ${DOMPurify.sanitize(contestResult.contestName)}
      </h2>
      <div class="panel-block is-block"></div>
    `

    const contestTableElement = document.createElement('table')
    contestTableElement.className = 'table is-fullwidth is-striped is-hoverable'

    // eslint-disable-next-line browser-security/no-innerhtml
    contestTableElement.innerHTML = /* html */ `
      <thead>
        <tr>
          <th>Choice</th>
          <th class="has-text-right">Votes</th>
          <th class="has-text-right" style="width:10em">Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${contestResult.choiceResults
          .toSorted((a, b) => b.votes - a.votes)
          .map(
            (choiceResult) => /* html */ `
              <tr class="${choiceResult.isWinner === 1 ? 'has-background-success-light has-text-weight-semibold' : ''}">
                <td>${DOMPurify.sanitize(choiceResult.choiceName)}</td>
                <td class="has-text-right">
                  ${contestResult.isAcclaimed ? '-' : DOMPurify.sanitize(choiceResult.votes.toLocaleString())}
                </td>
                <td class="has-text-right">
                  ${contestResult.isAcclaimed ? '<span class="tag is-success">Acclaimed</span>' : DOMPurify.sanitize(choiceResult.percentage)}
                </td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    `

    contestContainerElement
      .querySelector('.panel-block')
      ?.append(contestTableElement)
    containerElement.append(contestContainerElement)
  }

  function renderAllContestResults(): void {
    if (areaResultsJson === undefined) {
      return
    }

    ;(
      document.querySelector('#header-closedTabulators') as HTMLElement
    ).textContent =
      areaResultsJson.statistics.globClosedTabulators.toLocaleString()

    ;(document.querySelector('#header-tabulators') as HTMLElement).textContent =
      areaResultsJson.statistics.globTabulators.toLocaleString()

    ;(document.querySelector('#header-ballotCast') as HTMLElement).textContent =
      areaResultsJson.statistics.globBallotCast.toLocaleString()

    ;(
      document.querySelector('#header-eligibleVoters') as HTMLElement
    ).textContent = areaResultsJson.statistics.eligibleVoters.toLocaleString()

    ;(document.querySelector('#header-turnout') as HTMLElement).textContent =
      areaResultsJson.statistics.globTurnout

    ;(document.querySelector('#footer-timestamp') as HTMLElement).textContent =
      areaResultsJson.statistics.timeStamp

    const timestampDate = new Date(areaResultsJson.statistics.timeStamp)

    if (
      timestampDate.getTime() + refreshCutoffMillis < Date.now() &&
      areaResultsJson.statistics.globClosedPolls > 0 &&
      areaResultsJson.statistics.globPolls ===
        areaResultsJson.statistics.globClosedPolls &&
      refreshTimeout !== undefined
    ) {
      try {
        globalThis.clearInterval(refreshTimeout)
      } catch {
        // ignore
      }

      refreshTimeout = undefined
      document.querySelector('#footer-refresh-interval')?.remove()
    }

    for (const areaResultObject of areaResultsJson.areaResults) {
      for (const areaResult of Object.values(areaResultObject)) {
        for (const contestResult of areaResult.contestResults) {
          renderContestResults(contestResult)
        }
      }
    }
  }

  function loadAreaResults(isFirstLoad = false): void {
    void fetch(`data/arearesults.json?_=${Date.now()}`)
      .then(
        async (response) =>
          (await response.json()) as unknown as AreaResultsJson
      )
      .then((_areaResults: AreaResultsJson) => {
        areaResultsJson = _areaResults

        if (isFirstLoad) {
          renderContestTabs()

          refreshTimeout = globalThis.setInterval(
            loadAreaResults,
            refreshMillis
          )
        }

        renderAllContestResults()
      })
      .catch(() => {
        if (areaResultsJson === undefined) {
          bulmaJS.alert({
            contextualColorName: 'danger',
            title: 'Error Loading Election Data',

            message: 'Please refresh your browser to try again.',
            okButton: {
              text: 'Refresh Now',

              callbackFunction() {
                globalThis.location.reload()
              }
            }
          })
        }
      })
  }

  /*
   * Load Area List
   */

  function selectContestTabByLinkElement(
    selectedTabElement: HTMLAnchorElement
  ): void {
    /*
     * Hide all tab containers
     */

    for (const sectionElement of tabsContainerElement?.querySelectorAll(
      'section'
    ) ?? []) {
      sectionElement.classList.add('is-hidden')
    }

    /*
     * Unselect all tabs
     */

    for (const tabListItemElement of tabsMenuElement?.querySelectorAll('li') ??
      []) {
      tabListItemElement.querySelector('a')?.classList.remove('is-active')
    }

    /*
     * Select tab
     */

    selectedTabElement.classList.add('is-active')

    tabsContainerElement
      ?.querySelector(`#contest-${selectedTabElement.dataset.contestId}`)
      ?.classList.remove('is-hidden')
  }

  function uncheckLoopThroughContests(): void {
    ;(
      document.querySelector('#footer-loopThroughContests') as HTMLInputElement
    ).checked = false
  }

  function selectContestTabByClick(event: MouseEvent): void {
    event.preventDefault()

    uncheckLoopThroughContests()

    const selectedTabElement = event.currentTarget as HTMLAnchorElement
    selectContestTabByLinkElement(selectedTabElement)
  }

  function selectNextContestTab(): void {
    const selectedTabElement =
      tabsMenuElement?.querySelector<HTMLAnchorElement>('a.is-active')

    if (selectedTabElement === undefined || selectedTabElement === null) {
      return
    }

    let nextTabListItemElement =
      selectedTabElement.parentElement?.nextElementSibling

    nextTabListItemElement ??= tabsMenuElement?.querySelector('li')

    const nextTabLinkElement =
      nextTabListItemElement?.querySelector<HTMLAnchorElement>('a')

    if (nextTabLinkElement === undefined || nextTabLinkElement === null) {
      return
    }

    selectContestTabByLinkElement(nextTabLinkElement)
  }

  function renderContestTabs(): void {
    if (areaResultsJson === undefined) {
      return
    }

    const contests = areaResultsJson.areaResults.flatMap((areaResultList) =>
      Object.values(areaResultList).flatMap(
        (areaResult) => areaResult.contestResults
      )
    )

    contests.sort((a, b) => a.sort - b.sort)

    let firstLinkElement: HTMLAnchorElement | undefined

    for (const contestResult of contests) {
      /*
       * Tab
       */

      const listItemElement = document.createElement('li')
      const linkElement = document.createElement('a')

      linkElement.dataset.contestId = contestResult.id
      linkElement.href = `#contest-${contestResult.id}`
      linkElement.textContent = contestResult.contestName

      linkElement.addEventListener('click', selectContestTabByClick)

      listItemElement.append(linkElement)
      tabsMenuElement?.append(listItemElement)

      firstLinkElement ??= linkElement

      /*
       * Container
       */

      const containerElement = document.createElement('section')
      containerElement.id = `contest-${contestResult.id}`
      containerElement.className =
        'is-hidden animate__animated animate__fadeIn animate__faster'
      containerElement.dataset.contestId = contestResult.id
      containerElement.textContent = `Loading ${contestResult.contestName}...`

      tabsContainerElement?.append(containerElement)
    }

    if (firstLinkElement !== undefined) {
      selectContestTabByLinkElement(firstLinkElement)
    }

    globalThis.setInterval(() => {
      if (
        document.querySelector<HTMLInputElement>('#footer-loopThroughContests')
          ?.checked ??
        false
      ) {
        selectNextContestTab()
      }
    }, loopMillis)
  }

  document
    .querySelector<HTMLButtonElement>('.is-toggle-contests-menu')
    ?.addEventListener('click', () => {
      document.querySelector('.menu')?.classList.toggle('is-hidden-touch')
    })

  document
    .querySelector<HTMLButtonElement>('.is-next-contest-button')
    ?.addEventListener('click', () => {
      uncheckLoopThroughContests()
      selectNextContestTab()
    })

  loadAreaResults(true)
})()
