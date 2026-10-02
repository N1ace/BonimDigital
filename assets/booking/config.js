window.BONIM_BOOKING = {
  // Leave empty for demo mode (bookings stay in this browser only).
  // Fill both after running supabase/booking-schema.sql — the anon key is public by design.
  // Use a dedicated Bonim project, never the misparat-lidor one (ggfcqrlpqiqpytoygqxs): it shares auth users and data.
  supabaseUrl: '',
  supabaseAnonKey: '',

  whatsapp: '972527905122',
  timeZone: 'Asia/Jerusalem',
  slotStep: 30,
  leadMinutes: 120,
  horizonDays: 30,

  // 0 = Sunday … 6 = Saturday. Must match booking_hours in the SQL.
  hours: {
    0: ['09:00', '18:00'],
    1: ['09:00', '18:00'],
    2: ['09:00', '18:00'],
    3: ['09:00', '18:00'],
    4: ['09:00', '18:00'],
    5: ['09:00', '13:00']
  },

  // Ids and minutes must match booking_services in the SQL.
  services: [
    { id: 'intro', minutes: 15, color: '#0038B8', icon: 'phone', free: true,
      he: { name: 'שיחת היכרות', desc: 'נכיר את העסק ונבין מה צריך. בלי התחייבות.' },
      en: { name: 'Intro call', desc: 'We get to know the business and what it needs. No commitment.' } },
    { id: 'website', minutes: 45, color: '#C2410C', icon: 'layout',
      he: { name: 'פגישת אפיון לאתר', desc: 'עוברים יחד על מבנה האתר, התוכן ומחיר מדויק.' },
      en: { name: 'Website planning session', desc: 'We go over structure, content and an exact price together.' } },
    { id: 'booking', minutes: 30, color: '#0B1B33', icon: 'calendar',
      he: { name: 'הדגמת מערכת תורים', desc: 'רואים את המערכת בפעולה ומתאימים אותה לעסק שלכם.' },
      en: { name: 'Booking system demo', desc: 'See the system in action and how it fits your business.' } },
    { id: 'store', minutes: 45, color: '#3B6FE0', icon: 'bag',
      he: { name: 'ייעוץ לחנות אונליין', desc: 'מוצרים, תשלומים ומשלוחים — מתכננים חנות שמוכרת.' },
      en: { name: 'Online store consultation', desc: 'Products, payments and shipping — planning a store that sells.' } },
    { id: 'app', minutes: 60, color: '#E0703A', icon: 'mobile',
      he: { name: 'פגישת רעיון לאפליקציה', desc: 'בודקים את הרעיון, מה צריך בגרסה ראשונה וכמה זה עולה.' },
      en: { name: 'App idea session', desc: 'We test the idea, scope a first version and estimate the cost.' } },
    { id: 'review', minutes: 30, color: '#52607A', icon: 'search',
      he: { name: 'בדיקת אתר קיים', desc: 'עוברים על האתר שלכם: מהירות, גוגל ומה כדאי לשפר.' },
      en: { name: 'Existing site review', desc: 'We go through your site: speed, Google and what to improve.' } }
  ]
};
