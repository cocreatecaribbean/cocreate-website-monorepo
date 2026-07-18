# Admin Center — how to use it

Curated help for people signed into the CoCreate Admin Center (agency team). Answers should guide admins to the right screen in plain language.

## What this portal is

The Admin Center is CoCreate Caribbean’s internal workspace for client work: projects, organizations, messaging, Social Listening grants, and the agency team roster. Sign in with an agency admin account (seeded or invited). Supabase sign-in alone is not enough — your email must be an active admin in the system.

## Main navigation

| Item | Route | What it is for |
|------|-------|----------------|
| Dashboard | `/` | Agency overview, activity, and quick actions |
| Project Center | `/project-center` | Active projects, pipelines, and delivery status; open a client project workspace from here or Clients |
| Clients | `/clients` | Client organizations, portal access, invites, brand assets |
| Get Help | `/messages` | Conversations with client organizations (org inbox) |
| Social Listening | `/social-listening` | Brand mentions, analytics, listening setups / grants |
| Team | `/team` | Agency members, roles, and permissions |
| Profile | `/profile` | Your account details and preferences |
| Profile options | `/settings/agency-profile` | Agency branding and configuration (**super admins** only) |

Client access tooling also lives under `/client-access` and per-org pages like `/clients/[organizationId]`.

## Agency roles

| Role | What they can do |
|------|------------------|
| Super admin | Everything an admin can do, plus invite/suspend admins, change admin roles, manage agency profile options |
| Admin | Day-to-day client and project work; edit own profile |

Both can use most Admin Center features. Super-admin-only actions live mainly under **Team** and **Profile options**.

## Clients and portal access

- Open **Clients** to manage organizations.
- Invite clients so they can sign into the Client Portal.
- Enable Social Listening subscription / Brand24 project IDs on the org when needed.
- From a client workspace you can reach projects, messages, and related tabs.

## Messaging — two kinds

1. **Get Help (org inbox)** — WhatsApp-style chat with a client organization (billing, timelines, general topics). Open **Get Help** (`/messages`), pick a client / organization, then the conversation. Deep links often look like `/messages?organizationId=…&conversationId=…`.
2. **Project request threads** — Messages on a specific project request (onboarding, progress, checkpoints). Open the project from **Project Center** or **Clients**, then use the Progress / thread UI.

Where does a client message the agency generally? They use Client Portal → **Get Help**. You reply in Admin Center → **Get Help**.

## Project Center

- Use **Project Center** for pipelines and delivery status across active work.
- Open a project workspace for files, approvals / request threads, and collaboration with the client.

## Social Listening (admin)

- **Social Listening** in the sidebar covers mentions, analytics, and listening setups.
- Enabling live Brand24 data: Clients → enable Social Listening on the org → set Brand24 project ID → client completes a listening setup with keywords and platforms.
- If a client sees demo sample data, check subscription flags, API configuration, and project ID with engineering / ops — do not invent API keys in chat answers.

## Team (agency)

- **Team** manages agency members.
- Super admins invite additional admins, suspend accounts, and change roles between Super admin and Admin.
- You cannot suspend or demote the last Super admin.

## Collaborate

External collaborator surfaces live under `/collaborate` (separate login). The main Admin Center assistant focuses on agency workflows above; point collaborators to their collaborate login when relevant.

## FAQ

**Where do I answer a client’s general question?**  
**Get Help** (`/messages`) for that organization.

**Where do I discuss a project deliverable?**  
Open the project in **Project Center** or **Clients** and use the project request thread.

**Who invites new agency admins?**  
**Super admins** via **Team**.

**Who invites client portal users?**  
Any admin via **Clients** (and clients’ own org Admins can invite teammates inside the Client Portal Team hub).

**I cannot sign in.**  
Confirm the email is an active admin (not suspended) and that you are on the Admin Center login, not the Client Portal.

**I am stuck.**  
Check Team / Clients for access, or escalate to a Super admin.
