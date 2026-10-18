# שרת ההתחברות של MyPatterns (Cloudflare Worker)

שומר על החיבור לגוגל לאורך שבועות, בלי להתחבר מחדש כל שעה.
השרת לא שומר שום מידע אצלו: מפתח הרענון מוצפן ונשמר רק במכשיר של המשתמשת.

## משתנים (Settings → Variables and Secrets)
| שם | סוג | ערך |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Text | מזהה הלקוח של MyPatterns ב-Google Cloud |
| `APP_URL` | Text | `https://dikla-cloud.github.io/MyPatterns/` |
| `GOOGLE_CLIENT_SECRET` | Secret | הסוד של אותו לקוח |
| `ENC_KEY` | Secret | מחרוזת אקראית ארוכה (40 תווים ומעלה) |

ב-Google Cloud מוסיפים כתובת חזרה (Authorized redirect URI):
`https://<שם-השרת>.<החשבון>.workers.dev/callback`

ואז מוסיפים ל-`config.js` את השורה `authServer: 'https://<שם-השרת>.<החשבון>.workers.dev'`.
