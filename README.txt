OAU Navigator, Phase 1 (Tier 1 only). Sample data.
1. Upload ALL files to a GitHub repository (index.html at the top level) and turn on GitHub Pages.
2. The Collector page for the field team is the same link ending in /collect.html.
3. Back End turns field files into data with: python collector_to_data.py field-files --out .
4. See DEV_NOTES.md.

Live app:       https://samuel-jackson1.github.io/oau-campus-app/
Collector page: https://samuel-jackson1.github.io/oau-campus-app/collect.html

Back End routine, each time field files arrive (needs Node.js and Python):
a. Save EVERY received field-*.json file into the folder field-files (kept off GitHub on purpose).
b. npm run convert   (same as step 3; it also raises the version in sw.js)
c. Send the "Fix these" list back to Field Data.
d. npm test          (checks every place can be reached on foot from the Main Gate)
e. git add -A, git commit -m "Field data batch N", git push. The live link updates in about a minute.
f. Tell the chat.

Test on your computer: npm start, then open http://localhost:8000
