# Sault Ste. Marie 2026 Municipal Election Results

[**Find out more about the Sault Ste. Marie 2026 Municipal Election**](https://saultstemarie.ca/government/municipal-elections/)

On the night on October 26th, 2026, a website will be updated regularly
with results of the 2026 City of Sault Ste. Marie's municipal election
as they become available.
A backup of that website will be maintained on GitHub Pages
in the event of an interruption with the main results website.

**Note that the results on the website should be considered unofficial
until certified by the City Clerk.**

**Preparation is underway now.**
No significant changes are expected to the results website,
data file locations, or the data file definitions.
Note that test data, including data from the 2022 election
may be used leading up to the 2026 election.

**Main Election Results Website**<br />
<https://apps.saultstemarie.ca/electionResults>

**Backup Election Results Website**<br />
<https://cityssm.github.io/election-results-2026>

## Looking for the raw JSON data files?

**See [`data/arearesults.json`](data/arearesults.json).**

This file will be updated regularly on election night.
It is exported from tabulator software provided by
[Dominion Voting](https://www.dominionvoting.com/).

While the file is fairly clear, developers looking to
use the raw data files can refer to the [`js/types.ts`](js/types.ts)
Typescript file for further assistance.
