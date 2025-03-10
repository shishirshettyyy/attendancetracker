# Face Recognition Attendance 🤓✨

## What’s This Thing?
Hey there! This is my take on making attendance fun and futuristic. I built this app with **React** and hooked it up to **Teachable Machine** to spot faces via webcam. It talks to a **Node.js/Express.js** backend, saves everything in **MongoDB**, and lets you grab attendance lists as **CSV** or **PDF**. Oh, and it resets itself every night—pretty cool, right?


## How It Rolls
- **Smile for the Camera**: Look into your webcam, hit "Mark Attendance," and it’ll recognize you (if it’s 80%+ sure).
- **Today’s Crew**: See who showed up with their names and check-in times.
- **Take It Home**: Download the list as a CSV or a fancy PDF.
- **Fresh Start**: Every midnight, it clears out yesterday’s records.

## What’s Under the Hood
- **React**: Makes the front end smooth and lively.
- **Teachable Machine**: Handles the face-spotting magic.
- **Node.js/Express.js**: Keeps the backend humming.
- **MongoDB**: Stores all the attendance goodies.
- **PDFKit**: Turns data into nice-looking PDFs.
- **Node-Cron**: Resets things daily like clockwork.

## Give It a Spin
1. Grab it: `git clone https://github.com/shishirshettyyy/attendancetracker.git`
2. Set it up: `npm install` (for both frontend and backend)
3. Add some flavor: Pop `MONGO_URI=your-mongo-uri` and `PORT=5000` into a `.env` file
4. Fire it up: `node server.js` & `npm start`
5. Say cheese: Head to `http://localhost:3000`

## Stuff I’m Proud Of
- **Face Magic**: It catches faces in real-time and shows confidence levels.
- **Grab-and-Go Exports**: CSV for nerds, PDF for pros.
- **Daily Refresh**: No old data cluttering things up.
- **No Oopsies**: Blocks duplicates and sketchy scans.

## Bumps I Smoothed Out
- Getting **Teachable Machine** to play nice with the webcam took some tinkering.
- Making sure the PDFs looked sharp was a bit of a wrestle.
- Syncing the daily reset without hiccups? Yep, nailed it.

## What’s Next?
- Maybe a mobile-friendly tweak.
- Adding a dashboard to see trends.
- A little sound when it spots you—why not?

---

✨ **Made with a grin**—whether you’re here to code, learn, or just peek, enjoy! (Oh, and recruiters—wanna chat about this tech wizardry?) ✨
