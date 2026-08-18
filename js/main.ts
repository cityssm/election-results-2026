import type { BulmaJS } from '@cityssm/bulma-js/types.js'
import type { DOMPurify as DOMPurifyI } from 'dompurify'

import type { AreaListJson, AreaResults, AreaResultsJson } from './types.js'

declare const bulmaJS: BulmaJS
declare const DOMPurify: DOMPurifyI

;(() => {
  const refreshMillis = 30_000
  const loopMillis = 10_000

  let areaListJson: AreaListJson | undefined
  let areaResultsJson: AreaResultsJson | undefined

  const tabsMenuElement = document.querySelector<HTMLUListElement>('.menu-list')
  const tabsContainerElement = document.querySelector<HTMLElement>('main')

  function renderAreaResults(areaId: string, areaResult: AreaResults): void {
    const containerElement = tabsContainerElement?.querySelector<HTMLElement>(
      `#area-${areaId}`
    )

    if (containerElement === undefined || containerElement === null) {
      return
    }

    containerElement.textContent = ''

    for (const contestResult of areaResult.contestResults) {
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
      contestTableElement.className =
        'table is-fullwidth is-striped is-hoverable'

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
  }

  function renderAllAreaResults(): void {
    ;(
      document.querySelector('#header-closedTabulators') as HTMLElement
    ).textContent =
      areaResultsJson?.statistics.globClosedTabulators.toLocaleString() ?? ''

    ;(document.querySelector('#header-tabulators') as HTMLElement).textContent =
      areaResultsJson?.statistics.globTabulators.toLocaleString() ?? ''

    ;(document.querySelector('#header-ballotCast') as HTMLElement).textContent =
      areaResultsJson?.statistics.globBallotCast.toLocaleString() ?? ''

    ;(
      document.querySelector('#header-eligibleVoters') as HTMLElement
    ).textContent =
      areaResultsJson?.statistics.eligibleVoters.toLocaleString() ?? ''

    ;(document.querySelector('#header-turnout') as HTMLElement).textContent =
      areaResultsJson?.statistics.globTurnout ?? ''

    ;(document.querySelector('#footer-timestamp') as HTMLElement).textContent =
      areaResultsJson?.statistics.timeStamp ?? ''

    for (const areaResultObject of areaResultsJson?.areaResults ?? []) {
      for (const [areaId, areaResult] of Object.entries(areaResultObject)) {
        renderAreaResults(areaId, areaResult)
      }
    }
  }

  function loadAreaResults(): void {
    void fetch(`data/arearesults.json?_=${Date.now()}`)
      .then(
        async (response) =>
          (await response.json()) as unknown as AreaResultsJson
      )
      .then((_areaResults: AreaResultsJson) => {
        areaResultsJson = _areaResults
        renderAllAreaResults()
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

  function selectAreaTabByLinkElement(
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
      ?.querySelector(`#area-${selectedTabElement.dataset.areaId}`)
      ?.classList.remove('is-hidden')
  }

  function selectAreaTabByClick(event: MouseEvent): void {
    event.preventDefault()

    ;(
      document.querySelector('#footer-loopThroughAreas') as HTMLInputElement
    ).checked = false

    const selectedTabElement = event.currentTarget as HTMLAnchorElement
    selectAreaTabByLinkElement(selectedTabElement)
  }

  function selectNextAreaTab(): void {
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

    selectAreaTabByLinkElement(nextTabLinkElement)
  }

  function renderAreaTabs(): void {
    if (areaListJson === undefined) {
      bulmaJS.alert({
        contextualColorName: 'danger',
        title: 'Error Parsing Election Data',

        message: 'Please refresh your browser to try again.',
        okButton: {
          text: 'Refresh Now',

          callbackFunction() {
            globalThis.location.reload()
          }
        }
      })

      return
    }

    let firstLinkElement: HTMLAnchorElement | undefined

    for (const area of areaListJson) {
      /*
       * Tab
       */

      const listItemElement = document.createElement('li')
      const linkElement = document.createElement('a')

      linkElement.dataset.areaId = area.id
      linkElement.href = `#area-${area.id}`
      linkElement.textContent = area.areaName
      linkElement.addEventListener('click', selectAreaTabByClick)

      listItemElement.append(linkElement)
      tabsMenuElement?.append(listItemElement)

      firstLinkElement ??= linkElement

      /*
       * Container
       */

      const containerElement = document.createElement('section')
      containerElement.id = `area-${area.id}`
      containerElement.className = 'is-hidden'
      containerElement.dataset.areaId = area.id
      containerElement.textContent = `Loading ${area.areaName}...`

      tabsContainerElement?.append(containerElement)
    }

    if (firstLinkElement !== undefined) {
      selectAreaTabByLinkElement(firstLinkElement)
    }

    loadAreaResults()
    globalThis.setInterval(loadAreaResults, refreshMillis)

    globalThis.setInterval(() => {
      if (
        document.querySelector<HTMLInputElement>('#footer-loopThroughAreas')
          ?.checked ??
        false
      ) {
        selectNextAreaTab()
      }
    }, loopMillis)
  }

  void fetch(`data/arealist.json?_=${Date.now()}`)
    .then(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      async (response) => (await response.json()) as unknown as AreaListJson
    )
    .then((_areaList: AreaListJson) => {
      areaListJson = _areaList

      renderAreaTabs()
    })
    .catch(() => {
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
    })

  document
    .querySelector<HTMLButtonElement>('.is-next-area-button')
    ?.addEventListener('click', () => {
      ;(
        document.querySelector('#footer-loopThroughAreas') as HTMLInputElement
      ).checked = false

      selectNextAreaTab()
    })
})()
