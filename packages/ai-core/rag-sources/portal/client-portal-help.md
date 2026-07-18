# Client Portal — how to use it

Curated help for people signed into the CoCreate Client Portal. Answers should guide users to the right screen in plain language.

## What this portal is

The Client Portal is your organization’s workspace with CoCreate Caribbean. Use it to track projects, review files, message the agency, manage teammates (if you are an org admin), and — when subscribed — use Social Listening.

You sign in with the email your CoCreate team invited. Multiple organizations? Use the organization switcher in the header.

## Main areas (tabs)

At the top of the portal you typically see:

- **Control Center** — day-to-day project work and messaging with CoCreate
- **Social Listening** — brand mentions and analytics (only when your company has a Social Listening subscription and your role allows it)

Social Analysts often land in Social Listening only and may not see the full Control Center nav.

## Control Center navigation

Control Center views use the query param `ccView` on the home URL (`/`).

| View | URL | What it is for |
|------|-----|----------------|
| Overview | `/?ccView=overview` | Snapshot of projects, files, and actions |
| Projects | `/?ccView=projects` | Active workstreams with your CoCreate team; open a project for files, top picks, and request threads |
| Activity | `/?ccView=activity` | Recent updates across your workspace |
| Get Help | `/?ccView=messages` | Message CoCreate about billing, timelines, or topics not tied to one project step |
| Team | `/?ccView=team` | Organization members and project access (org admins) |
| Settings | `/?ccView=settings` | Appearance and portal preferences |

Older links like `approvals`, `files`, or `top-picks` as `ccView` values open **Projects**.

## Roles and permissions

| Role | Typical access |
|------|----------------|
| Admin | Full Control Center; invite teammates; manage Get Help / Social Listening flags; all org projects |
| Contributor | Assigned projects; messaging as allowed; Social Listening view/export when enabled for them |
| Viewer | Assigned projects, mostly read-only; no Get Help; no Social Listening |
| Social Analyst | Social Listening when the org is subscribed; little or no Control Center |

**Get Help access:** Admins always. Contributors usually yes (org admins can turn Get Help on/off per teammate on Team). Viewers and Social Analysts do not get Get Help.

**Team hub:** Org admins open Control Center → Team to invite people and manage access.

## Messaging — two kinds

1. **Get Help (org inbox)** — General chat with CoCreate (billing, timelines, general questions). Open **Control Center → Get Help** (`/?ccView=messages`). You may see an org-wide thread and, if your admin created them, restricted threads for selected people.
2. **Project request threads** — Messages on a specific project step (onboarding, progress, reviews, etc.). Open **Projects**, select the project, then use the project conversation / progress area.

Where do I message the agency about something not tied to one project? Use **Get Help**.

Where do I discuss a specific deliverable? Use the **project thread** inside that project.

## Projects, files, and top picks

- Open **Projects** to see workstreams.
- Inside a project you can browse files, react to top picks, and follow request threads with CoCreate.
- Attention / notifications may deep-link into the right project or Get Help conversation.

## Social Listening

- Available when your organization has a Social Listening subscription and your membership allows it.
- Admins and Social Analysts use the full Social Listening experience when subscribed.
- Contributors may view analytics and export when their admin enables Social Listening for them; they do not create listening setups.
- Viewers do not get Social Listening.
- Setup and live Brand24 data are configured with CoCreate / Admin Center; if data looks like a demo sample, ask your CoCreate contact.

## FAQ

**How do I get help from CoCreate?**  
Open Control Center → **Get Help** (`/?ccView=messages`), or ask your org admin if you cannot see that item.

**Who can invite teammates?**  
Organization **Admins** via Control Center → **Team**.

**I only see Social Listening.**  
You may be a Social Analyst, or your role does not include Control Center. Ask an org Admin if you need project access.

**Can I change organizations?**  
Yes — use the organization switcher in the header when you belong to more than one org.

**I am stuck.**  
Use Get Help if you have access, or email your CoCreate contact / org admin.
