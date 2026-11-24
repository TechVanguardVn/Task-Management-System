# FE-05: Project management

The existing shell/authentication, Stitch screenshot, design system, live OpenAPI specification, ProjectRequest/ProjectResponse and backend service were reviewed before implementation. The screenshot supplies visual style only. Application project records always come from the shared bearer-authenticated Axios client.

## Implemented API flows

| Operation | Endpoint | Behavior |
| --- | --- | --- |
| List | `GET /api/projects?page=N&size=9` | Three-column maximum grid, pagination, actual totalElements badge |
| Create | `POST /api/projects` | Validated modal, explicit ACTIVE status, refresh page zero and success feedback |
| Edit | `PUT /api/projects/{id}` | Complete name/description/color/status/startDate/dueDate representation |
| Archive | `PATCH /api/projects/{id}/archive` | Confirmation, active projects only; archived tasks remain readable |
| Delete | `DELETE /api/projects/{id}` | Explicit confirmation warning about permanent cascading task deletion |
| Open tasks | `GET /api/projects/{id}` and `GET /api/projects/{projectId}/tasks?page=N&size=10` | Protected read-only `/projects/:projectId/tasks` route; task links open existing read-only details |

No ownerId/userId is included in mutations. Ownership is enforced by the backend and its RLS context, not by client-side filtering. 401 handling reuses the existing session redirect; 403/404 are displayed without disclosing another owner's identity. API errors and field errors are translated to Vietnamese without exposing raw server diagnostics.

## Fields and validation

The modal supports required name (120 characters maximum), optional description (10,000), optional color (32), startDate and dueDate. Names are trimmed. Empty optional values become explicit nulls; other existing values are retained. When both dates are present, dueDate must be on/after startDate. Partially entered invalid browser date input is rejected. Color presets are UI choices, not project records; arbitrary existing color strings are preserved on edit. Valid CSS colors are shown on the card accent, with a safe default accent for non-CSS values.

PUT sends every supported field, preserving the existing ACTIVE/ARCHIVED status. The editor does not implicitly reactivate archived projects and there is no unarchive control or invented endpoint. Existing description, color and dates are initialized from the API response rather than omitted from PUT.

Native modal dialogs provide focus trapping, Escape handling, focus restoration and natural scrolling. Pending writes disable controls, prevent duplicate submissions and cannot be dismissed accidentally. Requests are aborted/ignored on unmount or session change; writes are never retried automatically, because a network failure does not prove that the backend rolled back. Error copy asks the user to reload the list before retrying.

After successful writes, the modal closes, a success message appears and the project page reloads. Creating resets to page zero and clears local search/status filtering. Other writes preserve the current page/filter. Empty out-of-range pages offer a return to the first page. Dashboard data has no persistent cross-route cache; returning to it already loads fresh summary/projects, so no dashboard change is needed.

## Search, filters and sorting limits

The project list API documents only page and size. Its server order is createdAt descending then id descending. No invented search/status/sort parameters are sent.

Name search is case-insensitive; ACTIVE/ARCHIVED filtering and createdAt/updatedAt/startDate/dueDate sorting operate only over the currently loaded page (maximum nine projects). Missing dates sort last. Labels and an always-visible explanation state this limitation. The API total remains the owner's global project total; the footer separately shows the loaded and visible counts. Filtered counts are never presented as global totals.

## Intentionally omitted

- Project progress bars and project-wide completed/total statistics: calculating these per card would require additional aggregate requests or paginated task reads, introducing N+1 traffic. Only actual project data is fetched for the grid.
- Screenshot summary metrics, team members, organization/phase/sprint/code/priority fields, fake server/CI status and promotional features.
- CSV export and Kanban actions, because these frontend flows do not exist yet.
- Task writes: the new project task route is a genuine paginated read-only API view, not a fake detail page.

## Verification

Executed locally: lint passed, all **75** unit tests passed with no failures/skips, and the Vite production build succeeded. New tests cover exact API routes/pagination, complete PUT preservation, archived status, intentional optional clearing, limits/date ranges, scoped case-insensitive filtering, stable sorting and errors.

Headless Edge checked protected navigation, initial request deduplication, pagination, current-page search/filtering, create/edit/archive/delete, duplicate-submit prevention, date/name validation, full PUT fields, preserved ARCHIVED status, canceled deletion, cascade warnings, project task navigation, backend validation/403/404/network failures and retries, empty-state creation and expired JWT redirects. Grid/dialog checks passed at 375/768/1024/1440px without horizontal overflow or React errors.

Browser APIs used isolated test-runner fixtures; all nonlocal traffic was intercepted. No real production project, account or task was created/modified/deleted. Live credential/CORS flows remain unverified. Backend, migrations and dependencies were unchanged; no push or deployment occurred.

## Files

Added:

- `src/api/projects.js`, `projectRequests.js`.
- `src/components/projects/ProjectCard.jsx`, `ProjectDialog.jsx`, `ProjectEditor.jsx`, `ProjectConfirmation.jsx`, `projectModel.js`, `projects.css`.
- `src/hooks/useProjectMutation.js`.
- `src/pages/ProjectTasksPage.jsx`.
- `tests/projects.test.js` and this document.

Modified: `src/pages/ProjectsPage.jsx`, `src/routes/AppRoutes.jsx`, and the frontend README. No unrelated pages or authentication components were changed.
