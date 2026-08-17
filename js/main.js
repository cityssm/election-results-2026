(() => {
    const refreshMillis = 30_000;
    let areaListJson;
    let areaResultsJson;
    const tabsMenuElement = document.querySelector('.menu-list');
    const tabsContainerElement = document.querySelector('main');
    function renderAreaResults(areaId, areaResult) {
        const containerElement = tabsContainerElement?.querySelector(`#area-${areaId}`);
        if (containerElement === undefined || containerElement === null) {
            return;
        }
        containerElement.textContent = '';
        for (const contestResult of areaResult.contestResults) {
            const contestContainerElement = document.createElement('div');
            contestContainerElement.className = 'panel';
            contestContainerElement.innerHTML = DOMPurify.sanitize(`
        <h2 class="panel-heading">
          ${contestResult.contestName}
        </h2>
        <div class="panel-block is-block"></div>
      `);
            const contestTableElement = document.createElement('table');
            contestTableElement.className = 'table is-fullwidth is-striped is-hoverable';
            contestTableElement.innerHTML = `
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
    }
    function renderAllAreaResults() {
        for (const areaResultObject of areaResultsJson?.areaResults ?? []) {
            for (const [areaId, areaResult] of Object.entries(areaResultObject)) {
                renderAreaResults(areaId, areaResult);
            }
        }
    }
    function loadAreaResults() {
        void fetch(`data/arearesults.json?_=${Date.now()}`)
            .then(async (response) => (await response.json()))
            .then((_areaResults) => {
            areaResultsJson = _areaResults;
            renderAllAreaResults();
        })
            .catch(() => { });
    }
    function selectAreaTabByLinkElement(selectedTabElement) {
        for (const sectionElement of tabsContainerElement?.querySelectorAll('section') ?? []) {
            sectionElement.classList.add('is-hidden');
        }
        for (const tabListItemElement of tabsMenuElement?.querySelectorAll('li') ??
            []) {
            tabListItemElement.querySelector('a')?.classList.remove('is-active');
        }
        selectedTabElement.classList.add('is-active');
        tabsContainerElement
            ?.querySelector(`#area-${selectedTabElement.dataset.areaId}`)
            ?.classList.remove('is-hidden');
    }
    function selectAreaTabByClick(event) {
        const selectedTabElement = event.currentTarget;
        selectAreaTabByLinkElement(selectedTabElement);
    }
    function renderAreaTabs() {
        if (areaListJson === undefined) {
            bulmaJS.alert({
                contextualColorName: 'danger',
                title: 'Error Parsing Election Data',
                message: 'Please refresh your browser to try again.',
                okButton: {
                    text: 'Refresh Now',
                    callbackFunction() {
                        globalThis.location.reload();
                    }
                }
            });
            return;
        }
        let firstLinkElement;
        for (const area of areaListJson) {
            const listItemElement = document.createElement('li');
            const linkElement = document.createElement('a');
            linkElement.dataset.areaId = area.id;
            linkElement.href = `#area-${area.id}`;
            linkElement.textContent = area.areaName;
            linkElement.addEventListener('click', selectAreaTabByClick);
            listItemElement.append(linkElement);
            tabsMenuElement?.append(listItemElement);
            firstLinkElement ??= linkElement;
            const containerElement = document.createElement('section');
            containerElement.id = `area-${area.id}`;
            containerElement.className = 'is-hidden';
            containerElement.dataset.areaId = area.id;
            containerElement.textContent = `Loading ${area.areaName}...`;
            tabsContainerElement?.append(containerElement);
        }
        if (firstLinkElement !== undefined) {
            selectAreaTabByLinkElement(firstLinkElement);
        }
        loadAreaResults();
        globalThis.setInterval(loadAreaResults, refreshMillis);
    }
    void fetch(`data/arealist.json?_=${Date.now()}`)
        .then(async (response) => (await response.json()))
        .then((_areaList) => {
        areaListJson = _areaList;
        renderAreaTabs();
    })
        .catch(() => {
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
    });
})();
