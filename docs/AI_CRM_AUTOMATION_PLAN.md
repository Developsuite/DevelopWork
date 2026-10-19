# DevelopWork AI CRM Automation Plan

**Status:** Proposed  
**Created:** October 20, 2026  
**Scope:** Workspace-admin AI automation, CRM data operations, task assignment, email and Telegram notifications, and secure OpenRouter integration.

## 1. Objective

Replace the current general-purpose, read-only chatbot with a secure AI Command Center that allows a workspace administrator to operate DevelopWork using natural-language instructions.

The finished system should allow an administrator to:

- Search and summarize workspace data.
- Create and update CRM records from a prompt.
- Create projects, tasks, leads, clients, contacts, documents, meetings, and draft financial records.
- Assign tasks to employees by name or email.
- Send task-assignment notifications through the application, email, and Telegram.
- Preview and confirm important actions before execution.
- Review a complete audit trail of AI-generated changes.
- Keep all actions isolated to the administrator's workspace.

The assistant must be visible and usable only by workspace administrators.

## 2. Current-State Assessment

The application already contains an AI chatbot and a set of read-only tools. The current implementation is located primarily in:

- `client/src/components/common/AIChatbot/AIChatbot.jsx`
- `client/src/services/aiService.js`
- `client/src/App.jsx`
- `client/src/services/projectService.js`
- `client/src/services/notificationService.js`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/010_multi_tenancy.sql`
- `supabase/migrations/013_notifications.sql`

### 2.1 Existing capabilities

- Chat interface with conversation history for the current browser session.
- OpenRouter chat-completions integration.
- Read-only function tools for projects, tasks, users, clients, finance, HR, leads, and documents.
- Supabase-backed business services with create, update, and delete methods.
- Workspace roles for administrators, managers, and employees.
- Basic tenant identifiers and Row Level Security policies.
- In-app task-completion notifications.
- Existing `chatbot_logs` and `audit_logs` tables.

### 2.2 Current limitations and risks

1. The OpenRouter key is loaded from `VITE_OPENROUTER_API_KEY`. Vite variables are included in browser code and are not safe for secret API keys.
2. AI tool execution happens in the browser.
3. AI permission checks rely partly on frontend user data.
4. The chatbot is rendered for every authenticated user, not only administrators.
5. The AI tools can read data but cannot create or update it.
6. The AI loop supports only a limited tool-call cycle and is not suitable for reliable multi-step workflows.
7. Current tenant policies broadly use `FOR ALL`, which is too permissive for an AI system with write access.
8. The current logs do not record action proposals, confirmation, tool arguments, before/after values, delivery results, or failures.
9. Email and Telegram notification delivery do not exist.
10. The latest notification-table migration recreates the table after the multi-tenancy migration and does not restore its `tenant_id` column.

## 3. Proposed Architecture

```text
Workspace Administrator
          |
          v
AI Command Center (React)
          |
          | Authenticated Supabase request
          v
Supabase Edge Function: ai-agent
          |
          |-- Verify user session
          |-- Require role = admin
          |-- Resolve tenant_id
          |-- Call OpenRouter securely
          |-- Validate requested tools
          |-- Apply action policy
          |-- Execute approved database RPCs
          |
          +-------------------+---------------------+
          |                   |                     |
          v                   v                     v
      CRM tables         AI audit tables     Notification outbox
                                                    |
                                      +-------------+-------------+
                                      |             |             |
                                      v             v             v
                                   In-app         Email        Telegram
```

### 3.1 Trust boundaries

- The language model may propose a tool call, but it must never execute SQL directly.
- OpenRouter must not receive Supabase database credentials.
- The browser must not receive OpenRouter, email-provider, Telegram-bot, or Supabase secret keys.
- The Edge Function must authenticate and authorize every request independently of the frontend.
- The server must derive `user_id`, `role`, and `tenant_id`; these values must not be trusted when supplied by the client or model.
- Every tool must use a predefined input schema and an explicit allowlist of writable fields.

## 4. OpenRouter Security and Key Migration

The existing browser-exposed OpenRouter key should be treated as compromised.

### 4.1 Migration procedure

1. Create a new key under the funded OpenRouter account.
2. Name the key clearly, for example `developwork-ai-production`.
3. Apply a daily or monthly credit limit.
4. Store the new key as the Supabase Edge Function secret `OPENROUTER_API_KEY`.
5. Add the key to `supabase/functions/.env` for local Edge Function development only.
6. Ensure all secret environment files are ignored by Git.
7. Remove `VITE_OPENROUTER_API_KEY` from the client application.
8. Revoke the old OpenRouter key.
9. Confirm that the built frontend contains no OpenRouter credentials.

### 4.2 Model configuration

The model name should also be server-side configuration:

```text
OPENROUTER_MODEL=<selected-tool-capable-model>
```

The chosen model must support reliable function/tool calling. The production configuration should include:

- Maximum output tokens.
- Request timeout.
- Maximum tool iterations.
- Per-request cost limits where available.
- Tenant and administrator rate limits.
- Fallback behaviour when the provider is unavailable.

## 5. Admin-Only AI Command Center

### 5.1 Frontend visibility

Render the Command Center only when:

```text
isAuthenticated = true
user.role = admin
```

Managers and employees must not receive the AI component, its JavaScript workflow, or its navigation entry.

### 5.2 Backend enforcement

Frontend hiding is not security. The Edge Function must:

1. Validate the Supabase user JWT.
2. Load the caller's profile from the database.
3. Require `role = admin`.
4. Reject unauthorized requests with HTTP 403.
5. Resolve the caller's tenant from the authenticated profile.

### 5.3 Recommended interface

Rename the feature from a generic chatbot to **AI Command Center**. The interface should include:

- Chat and command history.
- Suggested commands.
- Action-preview cards.
- Confirm, cancel, and edit controls.
- Links to created or updated records.
- Notification-delivery status.
- Retry controls for failed notifications.
- Recent AI actions.
- Undo for actions that have a safe inverse operation.

Example prompts:

- "Create a high-priority task for Talha due Friday."
- "Create a lead for ABC Traders and add a follow-up next Monday."
- "Move qualified leads older than 30 days into follow-up."
- "Create a client and draft a project from this description."
- "Draft an email for all overdue invoices."
- "Show overdue tasks and suggest balanced reassignments."

## 6. AI Tool Registry

The model must only be able to request tools registered on the server.

### 6.1 Read-only tools

- `search_employees`
- `get_employee_workload`
- `get_projects`
- `search_tasks`
- `get_overdue_tasks`
- `get_leads`
- `get_clients`
- `get_contacts`
- `get_invoices`
- `get_expenses`
- `get_leave_requests`
- `get_documents`
- `get_meetings`

### 6.2 Initial write tools

- `create_task`
- `assign_task`
- `update_task`
- `create_project`
- `create_lead`
- `update_lead`
- `update_lead_stage`
- `create_client`
- `update_client`
- `create_contact`
- `add_client_note`
- `create_document`
- `schedule_meeting`
- `create_invoice_draft`
- `create_expense_request`

### 6.3 Notification tools

- `queue_in_app_notification`
- `queue_email_notification`
- `queue_telegram_notification`
- `get_notification_delivery_status`
- `retry_failed_notification`

Notification tools should normally be triggered as part of a business action instead of called directly by the model.

### 6.4 Initially prohibited operations

The first release must not allow the AI to:

- Delete or disable user accounts.
- Promote users to administrator.
- Change authentication information or passwords.
- Grant module permissions.
- Modify payroll.
- Approve payments or expenses.
- Permanently delete business records.
- Execute arbitrary SQL.
- Call an arbitrary URL.
- Send an unreviewed bulk external message.

## 7. Action-Risk and Confirmation Policy

| Risk level | Examples | Required behaviour |
|---|---|---|
| Read-only | Search, summarize, count, report | Execute immediately |
| Low-risk write | Create a draft, note, or single task | Preview and confirm by default |
| External side effect | Send email or Telegram message | Always confirm |
| Sensitive write | Finance, HR, permissions, bulk updates | Always confirm with impact summary |
| Destructive | Delete or irreversible mutation | Disabled initially |

### 7.1 Confirmation preview

Before task assignment, show:

```text
Action: Create and assign task
Title: Prepare October sales report
Employee: Talha Rabani
Priority: High
Deadline: October 25, 2026
Project: Sales Operations
Notifications: In-app, Email, Telegram

[Cancel] [Edit] [Confirm and assign]
```

### 7.2 Ambiguity handling

The assistant must request clarification when:

- More than one employee matches a name.
- A project or client is ambiguous.
- A date has multiple interpretations.
- A required field is missing.
- A bulk operation's scope is unclear.
- The request conflicts with a validation or business rule.

The model must never silently guess the target employee or record.

## 8. Task-Assignment Workflow

For the instruction:

> Assign "Prepare client proposal" to Abdullah, due tomorrow, and notify him.

The system should perform these steps:

1. Authenticate the administrator.
2. Search for Abdullah within the current tenant.
3. Return a selection request if multiple employees match.
4. Resolve "tomorrow" using the configured workspace timezone.
5. Determine the target project or use the approved operational-task project.
6. Validate title, employee, deadline, priority, and project.
7. Create an action proposal.
8. Display the preview to the administrator.
9. Receive explicit confirmation.
10. Create the task and notification-outbox records in one transaction.
11. Create the in-app notification.
12. Deliver the email.
13. Deliver the Telegram message if the employee has connected Telegram.
14. Record provider results and failures.
15. Return the created task link and delivery summary.

Example result:

```text
Task created successfully.

In-app notification: Delivered
Email: Delivered
Telegram: Delivered
```

## 9. Email Notification Design

Use a server-side transactional email provider such as Resend. The provider key must be stored as an Edge Function secret, for example:

```text
RESEND_API_KEY
```

### 9.1 Task-assignment email content

- Employee name.
- Task title.
- Description.
- Project name.
- Priority.
- Deadline and workspace timezone.
- Administrator who assigned the task.
- A button linking directly to the task.
- Workspace name and branding.

### 9.2 Delivery requirements

- Store provider message ID.
- Track queued, sending, delivered, failed, and retrying states.
- Retry transient failures using exponential backoff.
- Do not retry invalid recipient addresses indefinitely.
- Do not roll back a successfully created task because an email provider is temporarily unavailable.
- Display delivery failure separately from task-creation success.

## 10. Telegram Integration

A Telegram bot cannot identify an employee using only their email address. Each employee must connect their Telegram account first.

### 10.1 Connection flow

1. Create a Telegram bot through BotFather.
2. Store `TELEGRAM_BOT_TOKEN` as an Edge Function secret.
3. Add a **Connect Telegram** control to employee profile/settings.
4. Create a short-lived, single-use connection token.
5. Open the Telegram bot using a deep link containing that token.
6. Receive the bot update through a Telegram webhook.
7. Validate the Telegram webhook secret header.
8. Match the connection token to the authenticated employee.
9. Store the Telegram chat ID in `user_integrations`.
10. Expire the connection token.
11. Allow the employee or administrator to disconnect Telegram.

### 10.2 Telegram task message

```text
New task assigned

Prepare client proposal
Priority: High
Due: October 21, 2026
Assigned by: Abbas Afzal

Open task: <secure application link>
```

### 10.3 Telegram security

- Keep the bot token server-side.
- Validate webhook requests with Telegram's secret token header.
- Store only required Telegram identifiers.
- Do not log the bot token or complete webhook payloads containing unnecessary personal data.
- Support opt-out and disconnection.

## 11. Database Design

### 11.1 `ai_conversations`

| Column | Purpose |
|---|---|
| `id` | Conversation identifier |
| `tenant_id` | Workspace isolation |
| `admin_id` | Conversation owner |
| `title` | Human-readable conversation title |
| `created_at` | Creation time |
| `updated_at` | Latest activity time |

### 11.2 `ai_messages`

| Column | Purpose |
|---|---|
| `id` | Message identifier |
| `conversation_id` | Parent conversation |
| `role` | System, user, assistant, or tool |
| `content` | Message text |
| `tool_calls` | Structured tool-call payload |
| `model` | Model used |
| `token_usage` | Input and output usage |
| `created_at` | Message time |

### 11.3 `ai_action_runs`

| Column | Purpose |
|---|---|
| `id` | Action identifier |
| `tenant_id` | Workspace isolation |
| `requested_by` | Administrator ID |
| `conversation_id` | Source conversation |
| `tool_name` | Registered tool name |
| `arguments` | Validated action arguments |
| `risk_level` | Read, low, external, sensitive, destructive |
| `status` | Current execution state |
| `requires_confirmation` | Whether approval is mandatory |
| `confirmed_at` | Confirmation timestamp |
| `before_value` | Previous record state |
| `after_value` | Resulting record state |
| `error_message` | Sanitized failure information |
| `idempotency_key` | Duplicate-execution protection |
| `created_at` | Creation time |

Recommended states:

```text
proposed
awaiting_confirmation
executing
completed
partially_completed
failed
cancelled
```

### 11.4 `notification_outbox`

| Column | Purpose |
|---|---|
| `id` | Delivery identifier |
| `tenant_id` | Workspace isolation |
| `recipient_id` | Employee receiving the event |
| `event_type` | Task assignment, deadline, approval, etc. |
| `channel` | In-app, email, or Telegram |
| `payload` | Validated notification data |
| `status` | Queued, sending, delivered, failed, retrying |
| `attempt_count` | Delivery attempts |
| `next_attempt_at` | Retry schedule |
| `provider_message_id` | Provider delivery reference |
| `last_error` | Sanitized failure reason |
| `created_at` | Creation time |
| `sent_at` | Successful delivery time |

### 11.5 `user_integrations`

| Column | Purpose |
|---|---|
| `id` | Integration identifier |
| `tenant_id` | Workspace isolation |
| `user_id` | Connected employee |
| `provider` | Telegram or future provider |
| `external_chat_id` | Telegram chat identifier |
| `connected_at` | Connection time |
| `disabled_at` | Disconnection time |

### 11.6 `integration_connection_tokens`

| Column | Purpose |
|---|---|
| `id` | Token record identifier |
| `tenant_id` | Workspace isolation |
| `user_id` | Intended employee |
| `provider` | Telegram |
| `token_hash` | Hashed one-time token |
| `expires_at` | Expiration time |
| `used_at` | Consumption time |

## 12. Transaction and Idempotency Requirements

Important AI actions should be implemented as database RPCs rather than unrelated browser requests.

For task assignment, one transaction should:

1. Validate the tenant and employee.
2. Check the idempotency key.
3. Create the task.
4. Create the in-app notification.
5. Create email and Telegram outbox jobs.
6. Create the audit entry.
7. Return the resulting task and delivery job IDs.

If the transaction fails, none of these records should remain partially created.

Notification delivery happens after the transaction. A provider failure must not create a duplicate task when retried.

## 13. RLS and Authorization Requirements

Before enabling AI writes:

- Replace broad `FOR ALL` tenant policies with operation-specific policies.
- Apply tenant validation using both `USING` and `WITH CHECK` where appropriate.
- Ensure new records receive the authenticated tenant ID.
- Ensure employees cannot update finance, HR, permission, or unrelated task records.
- Ensure managers can mutate only explicitly assigned modules.
- Ensure AI action tables are accessible only to workspace administrators.
- Ensure notification recipients can read their own notifications but cannot forge system notifications.
- Restore `tenant_id` to the current notifications table.
- Use server-resolved roles instead of trusting user metadata from the browser.
- Restrict privileged RPC execution to the AI Edge Function and authenticated administrators.

## 14. Audit, Observability, and Cost Controls

Every AI request should record:

- Administrator and tenant.
- Conversation and message IDs.
- Model name.
- Prompt/request category.
- Tool calls and validated arguments.
- Confirmation event.
- Affected entities.
- Before and after values.
- Execution duration.
- Token usage where available.
- Estimated or reported provider cost.
- Notification delivery results.
- Sanitized errors.

Operational controls:

- Limit requests per administrator and tenant.
- Limit maximum tool iterations per request.
- Limit records affected by a single command.
- Require confirmation for bulk operations.
- Apply an OpenRouter key spending limit.
- Alert administrators when AI requests repeatedly fail.
- Provide a kill switch to disable AI writes without disabling read-only queries.

Sensitive data, provider secrets, authentication tokens, passwords, and raw authorization headers must never be written to logs.

## 15. Implementation Phases

### Phase 1: Security foundation

- Tighten RLS policies.
- Fix notification tenant isolation.
- Add AI conversation, action, outbox, and integration tables.
- Add database RPCs and idempotency support.
- Add test fixtures for multiple tenants and roles.

**Estimated effort:** 2–4 development days.

### Phase 2: Server-side AI gateway

- Create the authenticated `ai-agent` Edge Function.
- Move OpenRouter access to the function.
- Rotate and secure the OpenRouter key.
- Implement structured tool schemas.
- Add tool-loop, timeout, and error handling.
- Persist conversations and usage data.

**Estimated effort:** 2–4 development days.

### Phase 3: Admin Command Center UI

- Restrict UI rendering to workspace administrators.
- Add conversation persistence.
- Add action-preview and confirmation cards.
- Add execution states, errors, and created-record links.
- Add recent action history.

**Estimated effort:** 2–3 development days.

### Phase 4: Task automation

- Add employee search and ambiguity resolution.
- Add task creation and assignment tools.
- Add transactional task-assignment RPC.
- Add in-app notifications.
- Add timezone-aware deadlines.
- Add idempotency and action auditing.

**Estimated effort:** 2–3 development days.

### Phase 5: Email delivery

- Configure the email provider.
- Build task-assignment templates.
- Process email outbox jobs.
- Add retry and delivery-state handling.
- Display delivery status in the Command Center.

**Estimated effort:** 1–2 development days.

### Phase 6: Telegram delivery

- Create the Telegram bot.
- Build employee connection flow.
- Add and secure the webhook Edge Function.
- Store user chat connections.
- Process Telegram outbox jobs.
- Add disconnect, retry, and status handling.

**Estimated effort:** 2–3 development days.

### Phase 7: CRM expansion

- Add Lead and Client tools.
- Add Project, Document, and Meeting tools.
- Add carefully restricted Finance and HR tools.
- Add bulk-operation controls.
- Add safe undo operations.

**Estimated effort:** 5–10 development days, depending on the number of approved tools.

### Phase 8: Hardening and release

- Add unit, integration, RLS, and end-to-end tests.
- Test prompt injection and malicious tool arguments.
- Test duplicate delivery and provider outages.
- Add cost dashboards and operational alerts.
- Complete an administrator acceptance test.
- Release read-only mode first, then enable writes progressively.

**Estimated effort:** 3–5 development days.

## 16. Testing Strategy

### 16.1 Authorization tests

- Administrator can call the AI function.
- Manager receives 403.
- Employee receives 403.
- Unauthenticated caller receives 401.
- Administrator from one tenant cannot access another tenant's data.

### 16.2 Tool validation tests

- Unknown tools are rejected.
- Unknown fields are removed or rejected.
- Invalid employee IDs are rejected.
- Invalid dates and statuses are rejected.
- The model cannot inject SQL into text fields.
- Bulk limits are enforced.

### 16.3 Task workflow tests

- Exact employee match creates a proposal.
- Ambiguous employee names require selection.
- Confirmation creates exactly one task.
- Repeated confirmation with the same idempotency key does not duplicate the task.
- Task and outbox records are transactionally consistent.
- Notification failure does not remove the created task.

### 16.4 Notification tests

- In-app notification appears for the correct employee.
- Email uses the correct employee email.
- Telegram uses the connected employee chat ID.
- A disconnected Telegram account is reported as unavailable.
- Transient failures retry.
- Permanent failures stop retrying and show the reason.

### 16.5 AI safety tests

- Prompt injection cannot expose secrets.
- A prompt cannot override server authorization.
- A prompt cannot invoke an unregistered tool.
- Sensitive and external actions always require confirmation.
- Destructive operations remain unavailable.
- Tool results are scoped to the authenticated tenant.

## 17. First-Release Acceptance Criteria

The first production-safe release is complete when:

- Only workspace administrators can see the Command Center.
- Only authenticated administrators can invoke the AI backend.
- The OpenRouter key is absent from the frontend bundle.
- The previous exposed key has been revoked.
- The administrator can query workspace data.
- The administrator can create and assign a task through natural language.
- The assistant resolves employees from real tenant data.
- Ambiguous employees require clarification.
- The administrator sees and confirms a preview before a write.
- Repeated requests do not create duplicate tasks.
- The employee receives an in-app notification.
- The employee receives a task-assignment email.
- Connected employees receive a Telegram message.
- Failed notification deliveries can retry safely.
- Every AI action is tenant-isolated and audited.
- Sensitive or destructive actions cannot run without the configured safeguards.

## 18. Required External Setup

Before implementation can be completed, the workspace owner will need:

- A funded OpenRouter account and a new API key.
- A verified email-sending domain and transactional email provider account.
- A Telegram bot token created through BotFather.
- Access to Supabase Edge Function deployment and secrets.
- The production application URL for email and Telegram task links.
- A decision about the production AI model and spending limit.

## 19. Recommended Delivery Decision

Do not enable every CRM mutation in the first release. Deliver the system progressively:

1. Secure read-only AI.
2. Task creation and assignment.
3. In-app, email, and Telegram notification delivery.
4. Lead and client operations.
5. Project, document, and meeting operations.
6. Restricted finance and HR operations.

This sequence establishes the security, audit, and notification foundations before the AI receives broader authority over business data.

## 20. Reference Documentation

- OpenRouter authentication: <https://openrouter.ai/docs/api_reference/authentication>
- OpenRouter tool calling: <https://openrouter.ai/docs/guides/features/tool-calling>
- Supabase Edge Function authentication: <https://supabase.com/docs/guides/functions/auth>
- Supabase Edge Function secrets: <https://supabase.com/docs/guides/functions/secrets>
- Telegram Bot API: <https://core.telegram.org/bots/api>
- Telegram `sendMessage`: <https://core.telegram.org/bots/api#sendmessage>
- Resend with Supabase Edge Functions: <https://resend.com/docs/send-with-supabase-edge-functions>

