-- Bonim Digital — delivered client projects. Run AFTER projects-schema.sql. Safe to run again (existing codes are skipped).
-- Keep in sync with realProjects() in assets/booking/store.js.

insert into projects (
  code, status, client_name, client_business, client_phone, client_email, client_city, client_lang,
  title, category, summary, start_date, deadline, requirements, tips, stages, updates, created_at, closed_at
) values (
  'BD-ARYN-0726', 'closed', 'לידור', 'Aryian Studio', null, null, 'אשדוד', 'he',
  'אתר + מערכת תורים ל־Aryian Studio', 'booking',
  'אתר למספרה עם מערכת תורים ותזכורות SMS אוטומטיות, ניהול לידים, ניהול הכיסאות שמושכרים לספרים ומאגר לקוחות, הכל במקום אחד. הלקוחות קובעים תור לבד, 24/7.',
  '2026-07-03', '2026-07-24',
  '["הזמנת תורים אונליין 24/7", "תזכורות SMS אוטומטיות לפני כל תור", "אתר למספרה", "ניהול לידים", "ניהול הכיסאות שמושכרים לספרים", "מאגר לקוחות"]'::jsonb,
  '["תשלום חד פעמי במקום מנוי חודשי, עם אפשרות לפריסה לתשלומים", "עלות חודשית רק על הודעות ה-SMS"]'::jsonb,
  '[
    {"k": "collect", "state": "done", "started_at": "2026-07-03T07:00:00Z", "done_at": "2026-07-04T06:00:00Z",
     "tasks": [{"k": "materials", "done": true}, {"k": "requirements", "done": true}, {"k": "tips", "done": true}, {"k": "plan", "done": true}]},
    {"k": "build", "state": "done", "started_at": "2026-07-04T06:00:00Z", "done_at": "2026-07-22T09:00:00Z",
     "tasks": [{"k": "database", "done": true}, {"k": "design", "done": true}, {"k": "branding", "done": true}, {"k": "debug", "done": true}, {"k": "security", "done": true}]},
    {"k": "deliver", "state": "done", "started_at": "2026-07-22T09:00:00Z", "done_at": "2026-07-22T15:00:00Z",
     "tasks": [{"k": "present", "done": true}, {"k": "tweaks", "done": true}, {"k": "guide", "done": true}]},
    {"k": "edits", "state": "done", "started_at": "2026-07-22T15:00:00Z", "done_at": "2026-07-24T14:59:00Z",
     "tasks": [{"k": "edits", "done": true}]}
  ]'::jsonb,
  '[
    {"id": "u1", "at": "2026-07-03T07:00:00Z", "kind": "created", "public": true},
    {"id": "u2", "at": "2026-07-04T06:00:00Z", "kind": "stage_done", "stage": "collect", "public": true},
    {"id": "u3", "at": "2026-07-04T06:01:00Z", "kind": "stage_start", "stage": "build", "public": true},
    {"id": "u4", "at": "2026-07-22T09:00:00Z", "kind": "stage_done", "stage": "build", "public": true},
    {"id": "u5", "at": "2026-07-22T09:01:00Z", "kind": "stage_start", "stage": "deliver", "public": true},
    {"id": "u6", "at": "2026-07-22T15:00:00Z", "kind": "stage_done", "stage": "deliver", "public": true},
    {"id": "u7", "at": "2026-07-22T15:01:00Z", "kind": "stage_start", "stage": "edits", "public": true},
    {"id": "u8", "at": "2026-07-24T14:59:00Z", "kind": "stage_done", "stage": "edits", "public": true},
    {"id": "u9", "at": "2026-07-24T15:00:00Z", "kind": "closed", "public": true}
  ]'::jsonb,
  '2026-07-03T07:00:00Z', '2026-07-24T15:00:00Z'
)
on conflict (code) do nothing;
