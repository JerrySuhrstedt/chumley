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
export const PUNCH_LIST_VERSION = "Beta 1.1";

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
     * first run of the app, and a tester read it as her first run of the
     * test and concluded she had been sent the wrong list. Two meanings,
     * one phrase, and the testing programme genuinely does have first and
     * second runs. The check ids stay FR-* because reports, backlog items
     * and generated retest lists all reference them; only the words on
     * screen change.
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
];

export const ALL_CHECKS: Check[] = SECTIONS.flatMap((s) => s.checks);
export const CHECK_IDS = new Set(ALL_CHECKS.map((c) => c.id));
