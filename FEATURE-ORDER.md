# Feature dependency order

```text
01 Bootstrap
   ↓
02 Foundation UI
   ↓
03 Auth + Profile
   ↓
04 Rooms
   ├───────────────┐
   ↓               ↓
05 Video Player    08 Presence
   ↓
06 Realtime Sync
   ↓
07 Roles + Permissions
   ↓
09 Watch Time
   ↓
10 MP4/HLS
   ↓
11 YouTube
   ↓
12 Room Settings
   ↓
13 Analytics

Optional after core is stable:
14 Chat

Then:
15 Security + Testing Hardening
   ↓
16 Deployment
```

Do not jump directly to analytics or UI polish before the synchronized two-browser flow works.
