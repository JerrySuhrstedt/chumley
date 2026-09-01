/**
 * The tester's punch list. Content lives here as data so the page, the
 * submit validation, and the admin report all agree on what the checks
 * are. Wording is written for a non-technical tester: "how" is what to
 * do, "should" is what correct looks like, in plain English.
 */

/**
 * Which punch list this is. Bump it when the checks change materially,
 * so runs in the back office say which list they were run against.
 */
export const PUNCH_LIST_VERSION = "Beta 1.2";

export type Check = {
  id: string;
  what: string;
  how: string;
  should: string;
  /**
   * A number this check exists to capture, shown as its own input beside
   * the checkbox rather than buried in the free-text write-up. `limit` is
   * the pass threshold: a reported value over it files a backlog item by
   * itself, with no prose needed from the tester.
   */
  measurement?: { kind: "seconds"; label: string; limit?: number };
};

export type Section = {
  key: string;
  title: string;
  lede: string;
  checks: Check[];
  /**
   * A round, not part of the default walk-in punch list. These sections
   * (usability, regression) are long and are only ever handed out as a
   * focused round via a tester's link, so they are hidden from the
   * everyday /uat list to keep it the tight bug sweep it was.
   */
  round?: boolean;
};

export const SEVERITIES = [
  "Stopped me",
  "Wrong",
  "Ugly",
  "Confusing",
  "Did not finish",
] as const;

export const SECTIONS: Section[] = [
  {
    key: "fr",
    /**
     * Called "Onboarding" because "First run" meant a new customer's
     * first run of the app, and a tester read it as their first run of
     * the test and concluded they had been sent the wrong list. Two
     * meanings, one phrase, and the testing programme genuinely does have
     * first and second runs. The check ids stay FR-* because reports,
     * backlog items and generated retest lists all reference them; only
     * the words on screen change.
     */
    title: "Onboarding",
    lede: "A brand new customer's first few minutes, which is the part that decides whether they ever come back. Use an email address that has never signed up before.",
    checks: [
      {
        id: "FR-1",
        what: "Sign up from nothing",
        how: "Brand new email address. Go all the way through.",
        should:
          "You name your team, then land on a board with three example deals already on it.",
      },
      {
        id: "FR-2",
        what: "Time it with a stopwatch",
        how: "Start the clock when you click Create Your Free Account. Stop it when a deal of your own is on the board. Tell us the real number even if it is bad.",
        should:
          "Under two minutes. The website promises this, so we need to know if it is true.",
        measurement: { kind: "seconds", label: "How many seconds did it take?", limit: 120 },
      },
      {
        id: "FR-3",
        what: "Read the two pop-up tips",
        how: "Two bubbles appear on the new board. Read them and see where they point.",
        should:
          "The first outlines a whole example card. The second outlines the Add lead button. Neither runs off the edge of the screen.",
      },
      {
        id: "FR-4",
        what: "Work the getting-started checklist",
        how: "Find the checklist of five steps and do them all: add a deal, tell it your name, move a deal, reach out to somebody.",
        should:
          "Each one ticks itself off as you do it, and the checklist celebrates when you finish.",
      },
      {
        id: "FR-5",
        what: "Sign out and back in",
        how: "Sign out. Close the browser completely. Open it again and go back.",
        should:
          "You are asked to sign in, and afterwards your board is exactly as you left it.",
      },
      {
        id: "FR-6",
        what: "Try a different way in",
        how: "There is Google, LinkedIn, and an emailed link. Try whichever you did not use the first time.",
        should:
          "All of them end up on your board. Tell us which one you used either way.",
      },
    ],
  },
  {
    key: "el",
    title: "The everyday loop",
    lede: "What a salesperson does forty times a day. If anything here is even slightly annoying, it is a real problem.",
    checks: [
      {
        id: "EL-1",
        what: "Add a deal with only a name and a phone number",
        how: "Leave every other box empty.",
        should: "It saves without complaining and lands in the first column.",
      },
      {
        id: "EL-2",
        what: "Move a card the whole way across",
        how: "Drag it through every column until it reaches Won. Then refresh the page.",
        should: "It is still exactly where you left it after the refresh.",
      },
      {
        id: "EL-3",
        what: "Set a next step due today",
        how: "Open a card, write the next thing to do, date it today.",
        should: "The Due today counter at the top of the board goes up by one.",
      },
      {
        id: "EL-4",
        what: "Tap Text and use a saved message",
        how: "Pick one of the ready-made messages rather than typing from scratch.",
        should:
          "Your texting app opens with the message already written and the person's real first name in it, not the word name in brackets.",
      },
      {
        id: "EL-5",
        what: "Put a number on a deal and win it",
        how: "Give a card a value like 4,500 and move it to Won.",
        should: "Money won at the top goes up by exactly that much.",
      },
      {
        id: "EL-6",
        what: "Write a note and click away",
        how: "Type a note on a card, then click somewhere else without looking for a Save button.",
        should: "The note is saved. Refresh to be sure.",
      },
      {
        id: "EL-7",
        what: "Search for somebody",
        how: "Type part of a name, then part of a company, then part of a phone number.",
        should: "The board narrows as you type, on all three.",
      },
      {
        id: "EL-8",
        what: "Rename a column",
        how: "Change a column name to something from your own world, then add a new column and drag it somewhere else.",
        should: "Your cards stay with their deals and nothing loses its place.",
      },
    ],
  },
  {
    key: "cl",
    title: "Calling from a lead",
    lede: "Add a deal whose phone number is a second number you own, so every call rings a phone in your pocket. These are the cases we most want hammered.",
    checks: [
      {
        id: "CL-1",
        what: "A real call from your smartphone",
        how: "On your phone, open the deal, tap Call, and complete the call to your own second number. Then come back and open the deal's history.",
        should: "The dialer takes over, and afterwards the call is logged by itself.",
      },
      {
        id: "CL-2",
        what: "A cancelled call from your smartphone",
        how: "Tap Call again, but cancel at the dial prompt instead of calling. Check the history. Worth repeating in Firefox if you have it; it handles the dial prompt differently.",
        should:
          "No call is logged, and a message says so with a button to log it anyway. A window claiming this computer can't place the call is a bug on a phone.",
      },
      {
        id: "CL-3",
        what: "A real call from a computer",
        how: "Click Call and let it really ring, staying on it at least 15 seconds. Leave yourself a voicemail if you like. Then pick how it went, like Left voicemail.",
        should:
          "The call logs by itself and the outcome you picked shows on it in the history.",
      },
      {
        id: "CL-4",
        what: "A cancelled call from a computer",
        how: "Click Call, let the calling app open, cancel before it connects, and come straight back to the browser.",
        should:
          "No call in the history. A message says it was not logged because you came right back, with a button to log it anyway.",
      },
      {
        id: "CL-5",
        what: "A computer with no calling app",
        how: "If your computer has nothing that can place calls, click Call and touch nothing. If a calling app opens instead, skip this one and say so.",
        should:
          "Within a couple of seconds, a window shows the number big, with a Copy button and an \"I made the call, log it\" button. Nothing is logged unless you press it.",
      },
      {
        id: "CL-6",
        what: "Undo a logged call",
        how: "Make one more short real call from the board, and when the Call logged message appears, press Undo.",
        should: "The call disappears from the deal's history.",
      },
    ],
  },
  {
    key: "md",
    title: "Messy real-world data",
    lede: "This is where the bugs actually are. Real customer lists are far uglier than anything a developer types in while testing.",
    checks: [
      {
        id: "MD-1",
        what: "A deal with no phone number",
        how: "Add somebody with a name only, then look at the Call and Text buttons.",
        should: "They do not pretend to work. Nothing should silently do nothing.",
      },
      {
        id: "MD-2",
        what: "Awkward phone numbers",
        how: "Try 602-555-1234 x22, then +44 20 7946 0958, then one pasted straight out of your contacts with spaces in it.",
        should: "Saved sensibly and still dialable. Tell us any that got mangled.",
      },
      {
        id: "MD-3",
        what: "Punctuation in names",
        how: "Add O'Brien, a company called Hall & Sons, and somebody with an accent in their name like Nunez with the tilde.",
        should:
          "All display normally everywhere, including in a text message you send them.",
      },
      {
        id: "MD-4",
        what: "A very long company name",
        how: "Something like Southwestern Regional Mechanical and Plumbing Contractors of Arizona.",
        should:
          "Stays inside its card. Nothing spills over the edge or pushes the layout sideways.",
      },
      {
        id: "MD-5",
        what: "Two people with the same name",
        how: "Add two deals both called Mike Sanders.",
        should:
          "You can still tell them apart, and editing one does not touch the other.",
      },
      {
        id: "MD-6",
        what: "Type nothing and press save",
        how: "Open Add lead and submit it completely empty. Then try one with only spaces in the name.",
        should:
          "Tells you what it needs in plain English. Not a code, not silence, and not an empty card on the board.",
      },
    ],
  },
  {
    key: "ph",
    title: "On a phone",
    lede: "This is where it will really be used, standing next to a truck. Try to do all of these one-handed.",
    checks: [
      {
        id: "PH-1",
        what: "Add a deal one-handed",
        how: "Thumb only, phone in one hand, start to finish.",
        should:
          "Doable without shifting your grip. Tell us if you had to use your other hand and where.",
      },
      {
        id: "PH-2",
        what: "Move a card without dragging",
        how: "Dragging with a thumb is horrible, so there should be another way.",
        should:
          "An obvious way to move a deal to the next stage. If you cannot find it in ten seconds, that is a bug worth reporting.",
      },
      {
        id: "PH-3",
        what: "Add it to your home screen",
        how: "Use Share, then Add to Home Screen. Open it from there.",
        should: "Opens like a proper app with no browser bar across the top.",
      },
      {
        id: "PH-4",
        what: "Make the text bigger",
        how: "In your phone settings, turn the system text size up a few notches, then come back.",
        should:
          "Still readable and still usable. This one catches a lot, and plenty of your buyers are over fifty.",
      },
    ],
  },
  {
    key: "wg",
    title: "When things go wrong",
    lede: "The richest section on this page. Software is usually tested by people being careful, so almost nothing here has ever been tried.",
    checks: [
      {
        id: "WG-1",
        what: "Lose signal halfway through",
        how: "Start adding a deal, turn on airplane mode before you save, press save, then turn signal back on.",
        should:
          "Tells you it could not save. What it must never do is say saved and then lose it.",
      },
      {
        id: "WG-2",
        what: "Hit the back button",
        how: "Add a deal, then press your browser or phone back button. Then do it again after opening a card.",
        should: "Goes somewhere sensible. No blank screens, no duplicate deals.",
      },
      {
        id: "WG-3",
        what: "Walk away and come back",
        how: "Leave a card open for an hour or two, go do something else, then come back and try to save a change.",
        should:
          "Either saves it or tells you to sign in again. It should not fail quietly.",
      },
    ],
  },
  {
    key: "us",
    title: "The hesitation test",
    round: true,
    lede: "A different kind of check. These are real jobs, not features. Do each one the way a busy roofer by their truck would, and tell us every spot where you paused, hunted for something, guessed wrong, or felt unsure, even for a second. A pause is the finding here, even when the thing eventually worked. The product is meant to be ridiculously simple, so those little stalls matter more than anything.",
    checks: [
      {
        id: "US-1",
        what: "First look, no help",
        how: "Open the board with the three example deals still on it. Before you touch anything, say out loud what the screen is showing you and what you think you are meant to do.",
        should:
          "You can tell a card is one person, that cards can be moved, and that the coloured line is the next step, without anyone explaining it. Tell us anywhere you paused or guessed.",
      },
      {
        id: "US-2",
        what: "Reach one person",
        how: "Pick a name on the board. Call them, then text a different one, using only what is on the card.",
        should:
          "Finding the person and starting the call or text takes no thinking and no second hand. Tell us every spot you had to hunt for a button.",
      },
      {
        id: "US-3",
        what: "Move a deal, both ways",
        how: "Move one named deal to the next stage on your phone, then do the same on a laptop.",
        should:
          "Obvious on both. On the phone, watch whether you grab the card or the whole column by mistake, and whether a quick swipe ever moves it two stages instead of one.",
      },
      {
        id: "US-4",
        what: "Add a lead in a hurry",
        how: "Pretend you just hung up with a new lead. Add them fast, one thumb, name and phone number only. Try a 1-800 number, and one with an extension like 602-555-1234 x22.",
        should:
          "It feels quick, not like a form. The phone field takes what you type, including a leading 1 and the extension, without fighting you, and the new deal is clearly there when you finish.",
      },
      {
        id: "US-5",
        what: "Was that saved?",
        how: "Open a deal, type a note about how a call went, then tap somewhere else or move on without pressing a save button.",
        should:
          "You are certain the note was kept. Nothing you typed disappears, and if it saved, you can see that it did.",
      },
      {
        id: "US-6",
        what: "Then what?",
        how: "After each thing you do in these tasks, stop and answer two questions out loud: what just happened, and what would you do next.",
        should:
          "The screen already answered both before you had to ask. Flag any action where the screen looked unchanged afterwards.",
      },
      {
        id: "US-7",
        what: "One thumb, standing up",
        how: "Redo any two of the tasks above using one thumb only, phone in one hand, standing up. No second hand.",
        should:
          "Everything important is in thumb reach, big enough to hit, and readable at arm's length. Tell us anywhere you needed your other hand.",
      },
      {
        id: "US-8",
        what: "Make it yours",
        how: "Add a new column for a stage your business has, and rename one you do not like. Try it on the phone first, then a laptop.",
        should:
          "You can do both from the phone, not just the laptop, and your existing deals stay exactly where they were.",
      },
      {
        id: "US-9",
        what: "The rough edges",
        how: "Two quick pokes at the corners. If you have Firefox on an Android phone, tap Call and cancel the dialer prompt, then tap Call a second time. Separately, in Add lead, type letters into the value or amount box.",
        should:
          "Cancelling a call shows the fallback quickly, not after a long frozen wait, and the second tap is just as quick. Letters in an amount are refused cleanly, never a crash or a blank screen.",
      },
    ],
  },
  {
    key: "reg-si",
    title: "Regression: sign up and sign in",
    round: true,
    lede: "The release-gate sweep. Tick each one that still works. If one fails, it means something we shipped is now broken, which is more urgent than a new bug. Note the check and what happened.",
    checks: [
      { id: "SI-1", what: "Sign up from nothing", how: "Brand-new email, name the team, land on the board.", should: "Board appears with three example deals, under two minutes." },
      { id: "SI-2", what: "Email and password", how: "Sign in with an existing email/password account.", should: "Lands on the board, no error." },
      { id: "SI-3", what: "Google", how: "Sign in with Google.", should: "Completes and lands on the board." },
      { id: "SI-4", what: "LinkedIn", how: "Sign in with LinkedIn.", should: "Completes and lands on the board. No 403." },
      { id: "SI-5", what: "Magic link", how: "Request a sign-in link, open it from the email.", should: "Signs you in. No 500." },
      { id: "SI-6", what: "Social on a password account", how: "Use Google or LinkedIn on an email that already has a password account.", should: "Lands on the login page with a plain message, never the marketing homepage with a raw error code." },
      { id: "SI-7", what: "Sign out and back in", how: "Sign out, close the browser, reopen, sign back in.", should: "Asks to sign in, then restores the board exactly as left." },
    ],
  },
  {
    key: "reg-bd",
    title: "Regression: board and deals",
    round: true,
    lede: "Every deal action that already works.",
    checks: [
      { id: "BD-1", what: "Add a deal", how: "Add one with just a name and a phone number.", should: "Appears in the first column, with a toast and a flash pointing at it." },
      { id: "BD-2", what: "Edit a deal", how: "Change name, company, value, phone, email.", should: "Saves and shows the new values." },
      { id: "BD-3", what: "Move on a laptop", how: "Drag a deal one stage forward, then refresh.", should: "Lands in the new stage and stays." },
      { id: "BD-4", what: "Move on a phone", how: "Swipe or use the arrow to move a deal.", should: "Moves exactly one stage, never two." },
      { id: "BD-5", what: "Next step due today", how: "Set a next action dated today.", should: "The Due today counter goes up by one." },
      { id: "BD-6", what: "Money won", how: "Set a value and move the deal to Won.", should: "Money won rises by exactly that amount." },
      { id: "BD-7", what: "Temperature sticks", how: "Change a lead's temperature, close, refresh.", should: "The temperature held." },
      { id: "BD-8", what: "Search", how: "Search by partial name and by phone number.", should: "The right leads show for each." },
      { id: "BD-9", what: "Delete a deal", how: "Delete one, then refresh.", should: "It goes and does not reappear." },
    ],
  },
  {
    key: "reg-rc",
    title: "Regression: reaching people",
    round: true,
    lede: "Calling, texting, emailing, and logging.",
    checks: [
      { id: "RC-1", what: "Real call from a phone", how: "Tap Call, complete it, return.", should: "Dialer opens; the call auto-logs to history." },
      { id: "RC-2", what: "Cancel a call on a phone", how: "Tap Call, cancel at the dial prompt. Try Firefox for Android too.", should: "Nothing logs; a not-logged notice appears quickly with a log-it-anyway option." },
      { id: "RC-3", what: "Real call from a laptop", how: "Call, let it ring, pick an outcome.", should: "Auto-logs with the chosen outcome shown." },
      { id: "RC-4", what: "Text a template", how: "Text using a saved message.", should: "Messaging app opens with the message filled and the real first name in it." },
      { id: "RC-5", what: "Email a deal", how: "Tap Email.", should: "Mail opens addressed to them; the touch is logged." },
      { id: "RC-6", what: "Undo a logged call", how: "After a call logs, press Undo on the toast.", should: "The activity is removed from history." },
      { id: "RC-7", what: "Note saves on click-away", how: "Type a note, tap away without pressing save.", should: "The note is saved, with an undo. Nothing typed is lost." },
    ],
  },
  {
    key: "reg-co",
    title: "Regression: columns and stages",
    round: true,
    lede: "Customizing the board.",
    checks: [
      { id: "CO-1", what: "Rename a column", how: "Rename one.", should: "New name sticks; cards stay put." },
      { id: "CO-2", what: "Add and reorder on a laptop", how: "Add a column, drag it somewhere.", should: "Inserts before Won/Lost; existing cards do not move." },
      { id: "CO-3", what: "Add a column on a phone", how: "Add a column from the mobile board.", should: "The Add control is reachable in the mobile stage row." },
      { id: "CO-4", what: "Delete the viewed column on mobile", how: "On a phone, delete the bucket you are looking at.", should: "The board does not go blank; it falls back to another stage." },
    ],
  },
  {
    key: "reg-on",
    title: "Regression: onboarding",
    round: true,
    lede: "The first-run experience.",
    checks: [
      { id: "ON-1", what: "Coach-mark tips appear", how: "Fresh account, look at the board.", should: "Both tip bubbles show and point at the card and the Add button, on screen." },
      { id: "ON-2", what: "Checklist works", how: "Work the getting-started checklist steps.", should: "Each step's button starts its action; steps tick as done; it celebrates at the end." },
      { id: "ON-3", what: "Reopen the checklist", how: "Dismiss the checklist, then bring it back.", should: "A Getting started entry in the account menu reopens it, on phone and laptop." },
      { id: "ON-4", what: "Clear the examples", how: "Clear the three sample deals.", should: "The samples go; the banner disappears." },
    ],
  },
  {
    key: "reg-tb",
    title: "Regression: team and billing",
    round: true,
    lede: "Money and members. Do not place a real charge; the preview step is safe.",
    checks: [
      { id: "TB-1", what: "Invite and join", how: "Open an invite link while signed in.", should: "Shows a Join this team? confirmation, does not auto-join, and joining shows the board, never an error page." },
      { id: "TB-2", what: "Seat preview", how: "Preview a seat change.", should: "The quote shows first; nothing is charged until a second button." },
      { id: "TB-3", what: "Cancel and resume", how: "Cancel a subscription, then resume it.", should: "Cancel schedules for period end; resume clears it. Board stays readable throughout." },
      { id: "TB-4", what: "Remove a member", how: "Remove a teammate.", should: "They leave; the seat frees." },
    ],
  },
  {
    key: "reg-wf",
    title: "Regression: website form and webhook",
    round: true,
    lede: "The ways a lead arrives on its own.",
    checks: [
      { id: "WF-1", what: "Hosted form", how: "Submit the form at the /f/ link.", should: "A lead lands on the board; the thank-you shows." },
      { id: "WF-2", what: "Script embed", how: "Paste the embed snippet on a test page and submit it.", should: "The form renders with fields in order (name, company, email, phone) and a lead arrives." },
      { id: "WF-3", what: "Editable heading", how: "Change the form heading in Settings, reload the embed.", should: "Settings confirms Saved; the new heading shows above the form." },
      { id: "WF-4", what: "Webhook", how: "Post to the webhook URL with a name.", should: "Returns the lead id; the lead appears with a form-submission activity." },
      { id: "WF-5", what: "New-lead email", how: "Send an inbound lead with notifications on.", should: "One email arrives, with the number to call back." },
    ],
  },
  {
    key: "reg-bo",
    title: "Regression: back office",
    round: true,
    lede: "The owner's own tools. Requires an admin account.",
    checks: [
      { id: "BO-1", what: "Runs group by tester", how: "Open Testing.", should: "Tester runs stack under one heading per tester, with their link." },
      { id: "BO-2", what: "View a full form", how: "Open a run's full form.", should: "Shows every check, ticks, notes, seconds, and screenshots as submitted." },
      { id: "BO-3", what: "Approve and reject", how: "Approve and reject backlog items.", should: "They move to the folded groups; the count updates." },
      { id: "BO-4", what: "Read a problem report", how: "Send one from Report a problem, then read it.", should: "It shows in the back office." },
    ],
  },
  {
    key: "reg-xc",
    title: "Regression: across everything",
    round: true,
    lede: "The things that cut across screens.",
    checks: [
      { id: "XC-1", what: "One-handed", how: "Do a full add-and-move one-handed on a phone.", should: "No grip change needed; targets are reachable." },
      { id: "XC-2", what: "Large text", how: "Turn up the phone's system text size, return.", should: "Text scales and stays usable." },
      { id: "XC-3", what: "No zoom on search", how: "Tap the search box on iOS Safari.", should: "The page does not auto-zoom." },
      { id: "XC-4", what: "Offline save", how: "Start a save, go offline, save, come back online.", should: "Tells you it could not save; never says saved and loses it." },
      { id: "XC-5", what: "Back button", how: "Press back after adding a lead and after opening a card.", should: "Sensible page, no blank screens, no duplicates." },
      { id: "XC-6", what: "Idle then save", how: "Leave a card open for hours, come back, save a change.", should: "Saves, or asks you to sign in again. Never fails silently." },
    ],
  },
  {
    key: "reg-rg",
    title: "Regression guards: bugs that must stay fixed",
    round: true,
    lede: "Every bug already fixed. These are the ones that creep back, and the ones a normal pass never thinks to try. Each must still be true. A failure here is a re-opened bug, not a new one.",
    checks: [
      { id: "RG-1", what: "Leading 1 in the phone field", how: "Type a 1-800 number digit by digit.", should: "The leading 1 is not swallowed; it types cleanly." },
      { id: "RG-2", what: "Phone extension survives", how: "Save a number with an extension like x22.", should: "The extension is kept; the tel: link dials the base number only." },
      { id: "RG-3", what: "No number, no call", how: "Open a lead that has no phone number.", should: "Call and Text are greyed out and do nothing." },
      { id: "RG-4", what: "Clean initials", how: "Add a deal named Hall and Sons (with an ampersand).", should: "The avatar reads HS, not H and the ampersand, everywhere." },
      { id: "RG-5", what: "Letters in the value field", how: "Type letters into a deal's value, then save.", should: "Refused cleanly, never a crash or blank screen." },
      { id: "RG-6", what: "Very long phone number", how: "Add a 13-plus digit phone number.", should: "Capped or rejected, not stored raw." },
      { id: "RG-7", what: "Junk token, not a crash", how: "Open /f/nonsense and post a webhook with a junk token.", should: "A clean not-found, never a 500." },
      { id: "RG-8", what: "Mobile banner and cards", how: "On the sample board on a narrow phone, read the examples banner.", should: "One tidy line; cards start near the top, not pushed off-screen." },
      { id: "RG-9", what: "Screenshot upload", how: "Attach a screenshot to a punch-list finding.", should: "It uploads and shows on the backlog card." },
      { id: "RG-10", what: "Firefox cancel is quick", how: "On Firefox for Android, tap Call and cancel the prompt, then tap Call again.", should: "The fallback appears quickly both times, not after a long frozen wait." },
    ],
  },
];

export const ALL_CHECKS: Check[] = SECTIONS.flatMap((s) => s.checks);
export const CHECK_IDS = new Set(ALL_CHECKS.map((c) => c.id));
