# Exercise 7: requirements review

Reviewed October 31, 2026 against Exercise 6 commit `15ff0c3`.

Invocation: `$requirements-reviewer Review the priority-filter feature against docs/priority-filter-spec.md. Do not change files.`

The review itself was read-only. The subsequent test changes implement the assignment's separate instruction to respond to the finding.

## Acceptance evidence

Line references below refer to the reviewed Exercise 6 files, which this exercise does not modify.

| Criterion and specification evidence | Implementation evidence | Review result |
| --- | --- | --- |
| AC1, `docs/priority-filter-spec.md:37` | `index.html:107-113` onward supplies a labeled native select with four options; `styles.css` focus rules retain an outline. | Satisfied by inspection; native keyboard behavior still needs a current browser check. |
| AC2, specification line 38 | `src/app.js:23-31`; `src/request-store.js:85-102` defaults and restores the preference. | Satisfied by inspection and preference unit tests; refresh is not covered by those tests. |
| AC3, specification line 39 | `src/request-store.js:105-108` uses exact equality. | Satisfied by inspection and exact-match unit tests. |
| AC4, specification line 40 | `src/request-store.js:60-78` preserves missing priority; `src/app.js:85` displays Not specified. | Satisfied by inspection and legacy-record unit tests; actual cell rendering requires browser verification. |
| AC5, specification line 41 | `src/request-store.js:105-108` sorts a new filtered array; stable JavaScript sort preserves ties. | Satisfied by inspection and unit tests for order, ties, and immutability. |
| AC6, specification line 42 | `src/app.js:34-38,69-75` handles recovery, persistence, table visibility, and counts. | Supported by inspection; automated app-event coverage was missing. |
| AC7, specification line 43 | `src/app.js:69-75` distinguishes no requests from no matches; `index.html` keeps the filter outside the empty state. | Supported by inspection; full browser check remains distinct. |
| AC8, specification line 44 | `src/app.js:41-55,69-75` appends, saves, and renders using the current filter. | Supported by inspection; automated submit/render coverage was missing. |
| AC9, specification line 45 | `src/request-store.js:18-28,60-78,105-108`; `index.html:70-75` defaults new requests to Normal. | Supported by validation, round-trip, legacy preservation, and immutability tests plus inspection. |
| AC10, specification line 46 | `src/request-store.js:85-102` catches preference failures separately from request storage. | Supported by unit tests; automated coverage of the app's success message and render path was missing. |

## Most important finding

**Accept: missing automated app integration coverage for AC6, AC8, and AC10.**

The original `tests/request-store.test.js:1-17` imports only the store module. Its preference-failure test exercises store functions directly. It cannot detect regressions in the actual change/click/submit handlers, visible count, empty states, or successful-save message at `src/app.js:29-75`. Those behaviors are required by `docs/priority-filter-spec.md:42,44,46`.

This is a high-confidence coverage gap, not a demonstrated implementation defect. The specification's October 16 browser results (`docs/priority-filter-spec.md:58-71`) are historical evidence and do not provide repeatable automated app coverage. There is no basis for changing working application logic merely to produce a defect fix.

Response: add `tests/app.test.js`. Three tests import the real app module with isolated storage and a minimal DOM boundary double. They check no-match recovery, unchanged request storage, saved All, restored focus, matching and nonmatching additions, visible rows/counts, successful save messages, and continued operation when preference reads/writes throw. No application behavior or production dependency changes.

## Unsupported behavior and data/security concerns

No feature-specific unsupported behavior or unsafe rendering was established. User content is assigned through `textContent` (`src/app.js:90-93`). Filtering uses a new array and writes only the preference; legacy records keep their missing priority. Existing date handling and request-storage failure behavior are outside this filter change and were not treated as newly introduced defects.

## Validation and remaining tests

The baseline `node --test` passed all 10 tests. After the response, it passes all 13 tests. This is the same command executed by `npm test`; npm is unavailable in this environment. Skill Creator's `quick_validate.py` reports `Skill is valid!`. The skill inspection confirms applicability, evidence sources, all five required report categories, and the prohibition on automatic edits.

The DOM double tests event wiring and rendering decisions, not a browser DOM. A fresh isolated headless Edge session additionally passed AC6 no-match visibility, hidden table, Show all recovery and refresh persistence, and AC8 matching/nonmatching additions, retained High selection, counts, and refresh. No page errors occurred. The check loaded the real HTML, CSS, and JavaScript through Playwright static-file routing because the existing development server returns Not found at its root URL on Windows. The server issue is separate from the filter review and was not changed here.

Native select keyboard operation, responsive layout, a full accessibility check, and all other browser scenarios were not rerun; the specification's historical results remain historical. No application source or visual behavior changed in this exercise.

Acceptance recommendation: accept the skill and focused coverage improvement, with the browser-verification limitation disclosed. The review did not establish an application requirement violation.
