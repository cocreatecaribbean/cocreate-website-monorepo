# Messaging files — plain English guide

This guide explains **which files power messaging** and **what each one does**, using simple language and everyday examples.

For technical debugging and architecture diagrams, see [project-thread-messaging.md](./project-thread-messaging.md) and [org-inbox-messaging.md](./org-inbox-messaging.md).

---

## The big picture (start here)

Imagine two people — a **client** and an **admin** — working on the same project. They want to send notes back and forth and see new notes show up right away, without refreshing the whole page.

Messaging in this app works like three teams working together:

1. **The save team (server)** — When someone sends a note, it gets written down in a safe filing cabinet (the database) and someone rings a bell so others can hear about it.
2. **The walkie-talkie team (shared messaging package)** — Each person’s browser keeps a walkie-talkie line open to the server. When the bell rings, the walkie-talkie tells their screen to show the new note.
3. **The screen team (admin center & client portal)** — The actual chat boxes, project pages, and inbox lists that people click and type in.

There are two kinds of chats:

- **Project thread** — Messages on a specific project (like “How is onboarding going?”).
- **Org inbox** — Broader company messages between client and admin (not tied to one project step).

---

## How a message travels (one story)

**Example:** Maria (client) types “We uploaded the logo” on a project and hits Send.

1. Maria’s screen shows her message right away (so it feels fast for her).
2. Her browser sends the message to the server.
3. The server saves it in the database (so it is never lost).
4. The server rings the bell in a **chat room** named after that project.
5. Anyone whose browser has **joined that room** hears the bell and adds the message to their on-screen list.
6. Tom (admin) sees “We uploaded the logo” appear on his Progress tab without refreshing.

If step 5 fails — Tom never joined the room, or his walkie-talkie was disconnected — Tom would not see the message until something else fetches it (like switching tabs or the app asking the server again).

That is why the “listen and join the room” files matter just as much as the “send and save” files.

---

## Server files (the save team + the bell)

These live in `apps/api/`.

### `messaging/messaging.gateway.ts`

**What it is:** The front desk for live connections.

**Plain English:** When your browser opens the app, it checks in here like showing an ID badge. The gateway says “You are allowed in.” When you open a project chat, your browser asks to **join a room** (like walking into a named clubhouse). When you leave, it **leaves the room**.

**Example:** Tom opens Project ABC. His browser tells the gateway: “Put me in room `request:abc-123`.” Now Tom is in the clubhouse for that project and can hear announcements for it.

---

### `messaging/messaging-emit.service.ts`

**What it is:** The person who makes announcements in rooms.

**Plain English:** After the server saves a new message (or a checkpoint, attachment update, or status change), this service **shouts into the right room** so every connected browser that joined that room gets the news instantly.

**Example:** Maria’s message is saved. The emit service walks to the `request:abc-123` room and says: “New message!” Every browser in that room updates.

---

### `messaging/messaging.module.ts`

**What it is:** The organizer that plugs messaging pieces into the API app.

**Plain English:** Like plugging in the walkie-talkie base station so the rest of the building can use it. You rarely touch this unless you are adding new messaging features to the server.

**Example:** When the API starts up, this file makes sure the gateway and emit service are ready to work together.

---

### `messaging/messaging.events.ts` (server copy)

**What it is:** The shared list of **signal words** — what to call “join room,” “new message,” and so on.

**Plain English:** Both server and browser must use the same words or they will not understand each other. This file defines those words on the server side.

**Example:** Everyone agrees the phrase for a new chat message is `thread:message`. When the server says `thread:message`, browsers know to show a new bubble in the thread.

---

### `projects/projects.service.ts`

**What it is:** The main worker for project requests — including saving thread messages.

**Plain English:** When someone posts a message on a project thread, this service checks they are allowed, **writes the message to the database**, then tells the emit service to announce it.

**Example:** Maria sends “We uploaded the logo.” This service saves that sentence forever, then tells the bell-ringer: “Announce this in project abc-123’s room.”

---

### `org-inbox/org-inbox.service.ts`

**What it is:** The same kind of worker, but for **org inbox** conversations (not a single project step).

**Plain English:** Company-wide or cross-project messages go through here. Save to database, then ring the inbox room bell.

**Example:** A client sends “Can we schedule a call?” in the main inbox. This service saves it and announces in room `inbox:conversation-456`.

---

## Shared package files (the walkie-talkie team)

These live in `packages/messaging/`. Both admin center and client portal use them.

### `messaging-provider.tsx`

**What it is:** The app-wide walkie-talkie that stays on while you use the site.

**Plain English:** This opens and keeps the live connection to the server. It remembers which rooms you asked to join — even if the line was not ready yet — and joins them as soon as the line connects. It also lets other parts of the app **subscribe** to events (like “new message”).

**Example:** Tom loads the admin site. The provider connects his walkie-talkie. He opens a project; the provider adds “room abc-123” to his list. If the line was still connecting, it joins abc-123 automatically the moment it is ready.

---

### `use-thread-live.ts`

**What it is:** The listener for **one project thread** — keeps messages fresh on screen.

**Plain English:** When you are looking at a project’s message list, this hook joins that project’s room, listens for new messages, and updates the on-screen list. It can also ask the server for messages again if something was missed (for example when you click back onto the browser tab).

**Example:** Tom is on the Progress tab for Project ABC. This hook joins room abc-123. When Maria sends a message, Tom’s list grows by one line without him clicking refresh.

---

### `use-inbox-live.ts`

**What it is:** The listener for **one org inbox conversation** — same idea as thread live, but for inbox chats.

**Plain English:** Joins an inbox room, listens for `inbox:message`, updates the inbox message list.

**Example:** Tom opens an inbox thread with Acme Corp. New messages from the client pop in live while he has that conversation open.

---

### `events.ts`

**What it is:** The shared dictionary of signal words and room names (browser copy).

**Plain English:** Defines how to name rooms (`request:...` for projects, `inbox:...` for inbox) and what events mean “new message,” “checkpoint,” etc.

**Example:** Project room for id `xyz` is always called `request:xyz` — same on server and in every browser.

---

### `is-messaging-enabled.ts`

**What it is:** A simple on/off switch check.

**Plain English:** Asks whether live messaging is turned on in this environment. If off, the app can skip opening walkie-talkies.

**Example:** In a test setup without a socket server, messaging might be disabled so the app still works using normal page loads only.

---

## Shared UI helper files

These live in `packages/app-ui/`.

### `thread-messages-list-cache.ts`

**What it is:** The notebook on your desk that holds the message list you are looking at.

**Plain English:** Browsers keep a fast local copy of messages (so the screen updates instantly). This file has helpers to **add** a new message to that copy, **merge** server data with what is already on screen, and **refresh** when needed — without duplicating the same message twice.

**Example:** Maria sends a message. Her screen adds it to the notebook immediately (optimistic). A second later the server confirms; the notebook replaces the temporary entry with the real one. Tom receives via socket; his notebook gets one new row.

---

### `thread-live-query.ts`

**What it is:** Instructions for how to **fetch** messages from the server when the app needs a full list.

**Plain English:** The walkie-talkie handles *new* stuff; sometimes you still need to load the whole conversation from the filing cabinet. This defines how that fetch works.

**Example:** Tom opens a project for the first time today. The app fetches all messages from the server, then turns on live listening for anything new.

---

## Admin center files (Tom’s side of the screen)

These live in `apps/admin-center/`.

### `lib/messaging/admin-messaging-provider.tsx`

**What it is:** Admin’s setup wrapper around the shared walkie-talkie.

**Plain English:** Tells the shared provider how admin logs in (access token), which “notebook labels” admin uses for query keys, and a name for debug logs. Keeps config stable so the connection does not flap on every re-render.

**Example:** Wraps the whole admin app so every page can use live messaging without repeating setup.

---

### `lib/messaging/use-admin-thread-live.ts`

**What it is:** Admin-specific version of “listen to this project thread.”

**Plain English:** Connects `use-thread-live` to admin’s API routes and query keys.

**Example:** The admin project workspace calls this to power the Progress tab message list.

---

### `lib/messaging/use-admin-inbox-live.ts`

**What it is:** Admin-specific version of “listen to this inbox conversation.”

**Example:** Powers live updates in the admin org inbox thread view.

---

### `lib/messaging/can-send-thread-message.ts`

**What it is:** The rule book for who may send a message on a thread.

**Plain English:** Checks project state and user role before showing or enabling the send box.

**Example:** If a project is closed, the rule book says “no new messages” even if you can still read old ones.

---

### `components/request-message-thread.tsx`

**What it is:** The actual chat UI — bubbles, input box, send button.

**Plain English:** What you see and type in. It can show messages from a parent page that already loaded them live, or load them itself on other screens.

**Example:** The Progress tab shows a scrollable list and a box that says “Type a message…”

---

### `components/admin-project-workspace.tsx`

**What it is:** The main admin project page (tabs like Progress, files, etc.).

**Plain English:** On the Progress tab, this page **owns** live messages — it listens via `use-admin-thread-live` and passes the list down to the chat component.

**Example:** Tom clicks a client project; this page starts listening to that project’s room and feeds messages to the thread component.

---

### `components/admin-org-inbox-thread-view.tsx`

**What it is:** Admin view of one org inbox conversation.

**Plain English:** Shows inbox messages and uses inbox live listening so new client messages appear while Tom is reading.

---

### `components/admin-org-inbox-conversation-list.tsx`

**What it is:** The list of inbox conversations (like an email inbox list).

**Plain English:** Shows which conversations exist and may update badges or ordering when new activity arrives.

---

### `app/layout.tsx` (admin)

**What it is:** The outer shell of the admin app.

**Plain English:** Wraps everything in `AdminMessagingProvider` so the walkie-talkie is available on every admin page.

**Example:** Tom navigates from dashboard to a project; he never loses the messaging connection because the provider wraps the whole app.

---

## Client portal files (Maria’s side of the screen)

These live in `apps/client-portal/`. They mirror the admin files with client-specific names and API routes.

### `lib/messaging/client-messaging-provider.tsx`

**What it is:** Client’s setup wrapper around the shared walkie-talkie.

**Example:** Same as admin provider, but uses the client portal login token and client query keys.

---

### `lib/messaging/use-client-thread-live.ts`

**What it is:** Client-specific “listen to this project thread.”

**Example:** Powers live messages on the client’s project Progress tab.

---

### `lib/messaging/use-client-inbox-live.ts`

**What it is:** Client-specific “listen to this inbox conversation.”

---

### `lib/messaging/can-send-thread-message.ts`

**What it is:** Client rule book for who can send on a thread.

---

### `lib/messaging/fetch-thread-summary.ts`

**What it is:** Fetches a short overview of a thread (for lists or previews).

**Example:** The client dashboard might show “3 new messages” without opening the full chat.

---

### `components/control-center/request-message-thread.tsx`

**What it is:** Client portal chat UI (same role as admin’s request message thread).

---

### `components/control-center/portal-project-workspace.tsx`

**What it is:** Client’s main project page; owns live messages on Progress like admin does.

---

### `components/control-center/org-inbox-messages-view.tsx`

**What it is:** Client view of org inbox messages.

---

### `app/layout.tsx` (client portal)

**What it is:** Wraps the client app in `ClientMessagingProvider`.

---

## Quick reference — who does what?

| Job | Who does it |
|-----|-------------|
| Save message forever | `projects.service.ts` or `org-inbox.service.ts` |
| Shout “new message!” to browsers | `messaging-emit.service.ts` |
| Let browsers connect and join rooms | `messaging.gateway.ts` |
| Keep browser line open | `messaging-provider.tsx` |
| Listen and update one project chat | `use-thread-live.ts` (+ admin/client wrappers) |
| Listen and update one inbox chat | `use-inbox-live.ts` (+ admin/client wrappers) |
| Remember messages on screen | `thread-messages-list-cache.ts` |
| Draw the chat box | `request-message-thread.tsx` |
| Turn on messaging for the whole app | `admin-messaging-provider.tsx` / `client-messaging-provider.tsx` in each `layout.tsx` |

---

## More examples to solidify the ideas

### Example 1: Joining the room late

Tom opens Project ABC **before** his walkie-talkie finishes connecting. The provider writes “I want room abc-123” on a sticky note. When the line connects a second later, it automatically joins abc-123. Maria’s next message still reaches Tom.

**Without that sticky note behavior:** Tom would never join the room, and he would miss live messages until something else refetched them.

---

### Example 2: Why the sender always feels faster

Maria hits Send. Her screen adds the message to her notebook **immediately** (she does not wait for the server). Tom only gets it when the server saves it and the walkie-talkie delivers it. So Maria always feels instant; Tom only feels instant if the listen path works.

---

### Example 3: Project thread vs org inbox

- **Project thread:** “Please approve this draft” on **one onboarding project** → room `request:that-project-id`.
- **Org inbox:** “Happy to help with anything this quarter” in the **general client–admin chat** → room `inbox:that-conversation-id`.

Same walkie-talkie system, different room names and different screen components.

---

### Example 4: When live fails, the safety net

Tom’s walkie-talkie missed a message. He clicks back to the browser tab. `use-thread-live` can ask the server for messages again and fix the notebook. The admin project workspace can also refresh its message list when the thread updates.

**Plain English:** If the shout in the room was missed, you can still go back to the filing cabinet and read what you missed.

---

### Example 5: Checkpoints and attachments (not just text)

Sometimes the server announces `thread:checkpoint` or `thread:attachment` instead of a plain text message — for example when a project milestone updates or a file is added. The same listen hook hears those signals and refreshes what is on screen so the Progress tab stays in sync.

**Example:** Maria uploads a file. The server saves it and rings a different bell (“attachment changed”). Tom’s Progress tab shows the new file without him refreshing the page.

---

## Related docs

- [project-thread-messaging.md](./project-thread-messaging.md) — Technical postmortem, architecture, debugging
- [org-inbox-messaging.md](./org-inbox-messaging.md) — Org inbox flows and API surface
