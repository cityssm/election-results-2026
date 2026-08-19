(() => {
    const refreshMillis = 30_000;
    let refreshTimeout;
    const refreshCutoffMillis = 30 * 86_400_000;
    const loopMillis = 10_000;
    let areaResultsJson;
    const tabsMenuElement = document.querySelector('.menu-list');
    const tabsContainerElement = document.querySelector('main');
    function renderContestResults(contestResult) {
        const containerElement = tabsContainerElement?.querySelector(`#contest-${contestResult.id}`);
        if (containerElement === undefined || containerElement === null) {
            return;
        }
        containerElement.textContent = '';
        const contestContainerElement = document.createElement('div');
        contestContainerElement.className = 'panel';
        contestContainerElement.innerHTML = `
      <h2 class="panel-heading">
        ${DOMPurify.sanitize(contestResult.contestName)}
      </h2>
      <div class="panel-block is-block p-2"></div>
    `;
        const contestTableElement = document.createElement('table');
        contestTableElement.className = 'table is-fullwidth is-striped is-hoverable';
        contestTableElement.innerHTML = `
      <thead>
        <tr>
          <th>Candidate</th>
          <th class="has-text-right">Votes</th>
          <th class="has-text-right" style="width:1em">Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${contestResult.choiceResults
            .toSorted((a, b) => b.votes - a.votes)
            .map((choiceResult) => `
              <tr class="${choiceResult.isWinner === 1 ? 'has-background-success-light has-text-weight-semibold' : ''}">
                <td>${DOMPurify.sanitize(choiceResult.choiceName)}</td>
                <td class="has-text-right">
                  ${contestResult.isAcclaimed ? '-' : DOMPurify.sanitize(choiceResult.votes.toLocaleString())}
                </td>
                <td class="has-text-right">
                  ${contestResult.isAcclaimed ? '<span class="tag is-success">Acclaimed</span>' : DOMPurify.sanitize(choiceResult.percentage)}
                </td>
              </tr>
            `)
            .join('')}
      </tbody>
    `;
        contestContainerElement
            .querySelector('.panel-block')
            ?.append(contestTableElement);
        containerElement.append(contestContainerElement);
    }
    function renderAllContestResults() {
        if (areaResultsJson === undefined) {
            return;
        }
        ;
        document.querySelector('#header-closedTabulators').textContent =
            areaResultsJson.statistics.globClosedTabulators.toLocaleString();
        document.querySelector('#header-tabulators').textContent =
            areaResultsJson.statistics.globTabulators.toLocaleString();
        document.querySelector('#header-ballotCast').textContent =
            areaResultsJson.statistics.globBallotCast.toLocaleString();
        document.querySelector('#header-eligibleVoters').textContent = areaResultsJson.statistics.eligibleVoters.toLocaleString();
        document.querySelector('#header-turnout').textContent =
            areaResultsJson.statistics.globTurnout;
        document.querySelector('#footer-timestamp').textContent =
            areaResultsJson.statistics.timeStamp;
        const timestampDate = new Date(areaResultsJson.statistics.timeStamp);
        if (timestampDate.getTime() + refreshCutoffMillis < Date.now() &&
            areaResultsJson.statistics.globClosedPolls > 0 &&
            areaResultsJson.statistics.globPolls ===
                areaResultsJson.statistics.globClosedPolls &&
            refreshTimeout !== undefined) {
            try {
                globalThis.clearInterval(refreshTimeout);
            }
            catch {
            }
            refreshTimeout = undefined;
            document.querySelector('#footer-refresh-interval')?.remove();
        }
        for (const areaResultObject of areaResultsJson.areaResults) {
            for (const areaResult of Object.values(areaResultObject)) {
                for (const contestResult of areaResult.contestResults) {
                    renderContestResults(contestResult);
                }
            }
        }
    }
    function loadAreaResults(isFirstLoad = false) {
        void fetch(`data/arearesults.json?_=${Date.now()}`)
            .then(async (response) => (await response.json()))
            .then((_areaResults) => {
            areaResultsJson = _areaResults;
            if (isFirstLoad) {
                renderContestTabs();
                refreshTimeout = globalThis.setInterval(loadAreaResults, refreshMillis);
            }
            renderAllContestResults();
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
                            globalThis.location.reload();
                        }
                    }
                });
            }
        });
    }
    function selectContestTabByLinkElement(selectedTabElement) {
        for (const sectionElement of tabsContainerElement?.querySelectorAll('section') ?? []) {
            sectionElement.classList.add('is-hidden');
        }
        for (const tabListItemElement of tabsMenuElement?.querySelectorAll('li') ??
            []) {
            tabListItemElement.querySelector('a')?.classList.remove('is-active');
        }
        selectedTabElement.classList.add('is-active');
        tabsContainerElement
            ?.querySelector(`#contest-${selectedTabElement.dataset.contestId}`)
            ?.classList.remove('is-hidden');
    }
    function uncheckLoopThroughContests() {
        ;
        document.querySelector('#footer-loopThroughContests').checked = false;
    }
    function selectContestTabByClick(event) {
        event.preventDefault();
        uncheckLoopThroughContests();
        const selectedTabElement = event.currentTarget;
        selectContestTabByLinkElement(selectedTabElement);
    }
    function selectNextContestTab() {
        const selectedTabElement = tabsMenuElement?.querySelector('a.is-active');
        if (selectedTabElement === undefined || selectedTabElement === null) {
            return;
        }
        let nextTabListItemElement = selectedTabElement.parentElement?.nextElementSibling;
        nextTabListItemElement ??= tabsMenuElement?.querySelector('li');
        const nextTabLinkElement = nextTabListItemElement?.querySelector('a');
        if (nextTabLinkElement === undefined || nextTabLinkElement === null) {
            return;
        }
        selectContestTabByLinkElement(nextTabLinkElement);
    }
    function renderContestTabs() {
        if (areaResultsJson === undefined) {
            return;
        }
        const contests = areaResultsJson.areaResults.flatMap((areaResultList) => Object.values(areaResultList).flatMap((areaResult) => areaResult.contestResults));
        contests.sort((a, b) => a.sort - b.sort);
        let firstLinkElement;
        for (const contestResult of contests) {
            const listItemElement = document.createElement('li');
            const linkElement = document.createElement('a');
            linkElement.dataset.contestId = contestResult.id;
            linkElement.href = `#contest-${contestResult.id}`;
            linkElement.textContent = contestResult.contestName;
            linkElement.addEventListener('click', selectContestTabByClick);
            listItemElement.append(linkElement);
            tabsMenuElement?.append(listItemElement);
            firstLinkElement ??= linkElement;
            const containerElement = document.createElement('section');
            containerElement.id = `contest-${contestResult.id}`;
            containerElement.className =
                'is-hidden animate__animated animate__fadeIn animate__faster';
            containerElement.dataset.contestId = contestResult.id;
            containerElement.textContent = `Loading ${contestResult.contestName}...`;
            tabsContainerElement?.append(containerElement);
        }
        if (firstLinkElement !== undefined) {
            selectContestTabByLinkElement(firstLinkElement);
        }
        globalThis.setInterval(() => {
            if (document.querySelector('#footer-loopThroughContests')
                ?.checked ??
                false) {
                selectNextContestTab();
            }
        }, loopMillis);
    }
    document
        .querySelector('.is-toggle-contests-menu')
        ?.addEventListener('click', () => {
        document.querySelector('.menu')?.classList.toggle('is-hidden-touch');
    });
    document
        .querySelector('.is-next-contest-button')
        ?.addEventListener('click', () => {
        uncheckLoopThroughContests();
        selectNextContestTab();
    });
    loadAreaResults(true);
})();
