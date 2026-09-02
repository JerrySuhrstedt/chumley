/**
 * The knowledge base, written as scripts.
 *
 * Every article here is authored to be read out loud first and set in a page
 * second. That is not a stylistic preference, it is the whole point: each one
 * doubles as the script for a short video, and an article adapted into a
 * script afterwards always sounds like an article being read aloud.
 *
 * So the content is a list of beats, and each beat carries `say`, which is
 * the narration. The page renders `say` as its body copy, in order, and
 * /support/<slug>/script renders the same strings with nothing around them.
 * There is no second copy to keep in sync, because there is no second copy.
 *
 * House rules for adding one:
 *   - Two minutes spoken, give or take. If it needs five, it is two articles.
 *   - One gotcha, the thing people actually get wrong. Not a list of caveats.
 *   - Say what is on screen using the words that are on screen. "Add a deal"
 *     is a button, so write "Add a deal", not "the create button".
 *   - Read it aloud before committing it. Anything you stumble over is wrong.
 */

export type Beat = {
  /** Heading on the page, and the chapter marker in the video. */
  title: string;
  /** The narration, one string per spoken paragraph. */
  say: string[];
  /**
   * Something to show while those lines are read. The narration must still
   * make sense without it, because a listener cannot see a table.
   */
  table?: {
    columns: string[];
    rows: { label: string; values: (boolean | string)[] }[];
    /** "good" for a capability matrix, where a green tick means it works. */
    tone?: "brand" | "good";
  };
  /**
   * A screenshot from the real app, in public/support. Regenerate every one
   * of them with: node scripts/screenshots/capture.mjs
   */
  image?: { src: string; alt: string };
};

export type Article = {
  slug: string;
  /** The H1, and the video title. Written to be searched for. */
  title: string;
  description: string;
  /** Roughly how long this runs spoken, in minutes. */
  minutes: number;
  /** Which group it sits under on the hub. */
  topic:
    | "Calling"
    | "Getting started"
    | "Day to day"
    | "Leads from your website"
    | "Billing";
  /** The problem in one line, spoken before anything else. */
  hook: string;
  beats: Beat[];
  /** The one thing people get wrong. */
  gotcha: { title: string; say: string[] };
  outro: string;
  /** Other slugs worth watching next. */
  related?: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: "how-calling-works",
    title: "Why Call works on your phone but not always on your computer",
    description:
      "The Call button hands the number to whatever on your device answers phone calls. On a phone that is the dialer. On a computer it depends what you have installed, and here is the full matrix.",
    minutes: 3,
    topic: "Calling",
    hook: "Tap Call on your phone and it dials. Click the same button on your laptop and sometimes nothing happens at all. That is not a bug in Chumley, and once you understand why, the fix takes about two minutes.",
    beats: [
      {
        title: "Chumley is not a phone",
        say: [
          "Here is the one idea the rest of this rests on. Chumley does not place calls. It never touches a phone network. What the Call button does is hand the number to your device and say, you handle this.",
          "That handover is a standard thing on the web. It is the same mechanism that makes a phone number clickable on any website you have ever visited. Your device then looks around for a program that has volunteered to answer phone calls, and gives it the number.",
          "So the question is never whether Chumley can call somebody. The question is what is installed on that particular device that has put its hand up for the job.",
        ],
      },
      {
        title: "On a phone, something always answers",
        say: [
          "This is why it feels effortless on mobile. An iPhone has the Phone app and an Android has its dialer, they are built in, and they cannot be removed. There is always something with its hand up.",
          "On an iPhone you get a small confirmation, then it dials. On Android the dialer opens with the number already in it and you press the green button. Either way it takes one tap and nothing had to be set up.",
          "If you do most of your calling from your phone, you can stop reading here. This all just works.",
        ],
      },
      {
        title: "On a computer, it depends what is installed",
        say: [
          "A desktop or a laptop has no dialer, because a computer is not a phone. So whether the Call button does anything at all comes down to whether some program on that machine has claimed phone calls for itself.",
          "A Mac usually has one, because FaceTime claims the job. Windows very often has nothing at all, which is why a brand new Windows laptop can click Call and produce complete silence.",
          "This is the full picture. Find your row.",
        ],
        table: {
          tone: "good",
          columns: [
            "Built-in dialer",
            "Apple FaceTime",
            "Windows Phone Link",
            "Microsoft Teams",
            "RingCentral, Aircall, Dialpad",
          ],
          rows: [
            { label: "iPhone", values: [true, true, false, true, true] },
            { label: "Android", values: [true, false, false, true, true] },
            { label: "Windows laptop or desktop", values: [false, false, true, true, true] },
            { label: "Mac", values: [false, true, false, true, true] },
          ],
        },
      },
      {
        title: "Reading that table",
        say: [
          "Two things in it need a sentence each, because a tick on its own would mislead you.",
          "Microsoft Teams ticks every row, and that is true in the sense that Teams will open. Whether it can then ring an ordinary phone number is a licensing question. Plain Teams, the kind that comes with Office, cannot. You need Teams Phone and a calling plan on top. If your Teams opens and then refuses to dial a customer, that is what is missing, and it is a conversation with whoever runs your Microsoft account rather than with us.",
          "The Mac row is the one people are most often pleased about. FaceTime can place a real call to any phone number, not just to other Apple users, but only by relaying it through your own iPhone. The phone has to be switched on, nearby, on the same Apple ID, with Calls from iPhone turned on. Leave the phone at home and the Mac row quietly becomes the Windows row.",
        ],
      },
      {
        title: "What to do if your computer does nothing",
        say: [
          "You have three honest options and there is no wrong answer.",
          "One, use your phone for calling and your computer for everything else. Most reps do this and it costs nothing. Chumley works on both and it is the same pipeline.",
          "Two, if you are on a Mac, turn on Calls from iPhone. Open FaceTime, go into settings, and switch on the option to make and receive calls through your iPhone. Keep the phone on the same wifi and it will place real calls from your desk.",
          "Three, if you are calling all day from a desk, get a proper VoIP seat. RingCentral, Aircall, Dialpad and the rest all install a desktop app that claims phone calls, and after that our Call button works exactly like it does on your phone. That is the setup a serious desk-based sales team wants anyway, because it also gives you recording and a real business number.",
        ],
      },
      {
        title: "What Chumley does when nothing answers",
        say: [
          "We assume this will happen, so we watch for it. If nothing takes over your screen within about half a second, Chumley stops waiting and just shows you the number, big, with a button to log the call yourself.",
          "That means the worst case is not a dead button. The worst case is you read the number off the screen, dial it however you normally would, and tap to log it. You lose the convenience, you do not lose the record.",
          "We are also careful about what gets written down. If your dialer opens and you are gone for a while, we log a call. If you come straight back after a few seconds, we ask you rather than guessing, because a call that never happened sitting on a customer record forever is worse than no record at all.",
        ],
      },
    ],
    gotcha: {
      title: "The one that catches people out",
      say: [
        "Firefox asks permission the first time, and the wording is easy to dismiss. It says something like, this link needs to be opened with another application. If you click cancel, or tick the box that says always ask and then refuse, Firefox quietly remembers that answer.",
        "From then on the Call button appears to do nothing, forever, and there is no message telling you why. People report this as the button being broken. It is not broken, it is a permission you turned down weeks ago.",
        "The fix is in Firefox settings, not in Chumley. Go to Settings, General, and scroll to Applications. Find the entry for tel and set it to ask you again, or point it at the program you want. If you would rather not go digging, just use your phone for calls, or install one of the VoIP apps from the table.",
      ],
    },
    outro:
      "So, the short version. Chumley hands the number to your device. Phones always have something ready to catch it, computers often do not, and a VoIP app or Calls from iPhone is what fixes that. If nothing catches it, we show you the number so you are never stuck.",
    related: ["add-your-first-lead"],
  },
  {
    slug: "edit-your-pipeline-columns",
    title: "Rename, reorder and delete your pipeline columns",
    description:
      "Make the board match how you actually sell. Rename a column in two clicks, drag them into your order, and delete one without losing the deals in it.",
    minutes: 3,
    topic: "Day to day",
    hook: "The board arrives with four columns because a blank board is useless on day one. They are not the columns you have to keep. If your process has a step called Waiting on permits, the board should say Waiting on permits.",
    beats: [
      {
        title: "The columns are yours",
        say: [
          "A lot of CRMs make this a settings page, three menus deep, with a warning about affecting your reporting. Here it is on the board itself. Everything in this tutorial happens on the pipeline screen, and none of it needs a save button.",
          "Each column has a name on the left, a running count and total on the right, and a small three dot menu next to that. Almost everything lives in that menu.",
        ],
        image: {
          src: "/support/pipeline-board.png",
          alt: "The Chumley pipeline board with four columns and three example deals, with the column menu button ringed",
        },
      },
      {
        title: "Rename one",
        say: [
          "Click the column name. It turns into a text box. Type the new name and press enter, or click away, and it is saved.",
          "Nothing else happens, and that is deliberate. Renaming changes the label and nothing underneath it. Your deals keep their history, your reports keep counting the same things, and every card that was in that column is still in it. So if New Lead should say Enquiry, or Proposal Sent should say Bid Out, just change it. You are not going to break a report.",
        ],
        image: {
          src: "/support/rename-bucket.png",
          alt: "A pipeline column name turned into an editable text box, ready to be renamed",
        },
      },
      {
        title: "Add one",
        say: [
          "Most people find the default four are one short. There is usually a real step between talking to somebody and sending them a price, and it is worth its own column because it is where deals get stuck.",
          "Add a bucket, name it, and it appears on the board. Name it after something that actually happens in your week, not after a stage in a sales methodology. Site Visit Booked is a good column. Qualification is not, because nobody can tell you what has to be true for a deal to leave it.",
        ],
        image: {
          src: "/support/add-bucket.png",
          alt: "Naming a new pipeline bucket",
        },
      },
      {
        title: "Put them in your order",
        say: [
          "Grab the handle at the top of a column and drag it left or right. The board reorders and stays that way for everybody on your team.",
          "Won and Lost do not move, and they cannot be dragged into the middle. They are the end of the board on purpose, because a deal that has landed in one of them has stopped moving, and letting them float around in the middle would make the board lie about what is in play.",
        ],
      },
      {
        title: "Delete one without losing the deals",
        say: [
          "Open the three dot menu on the column and choose Delete bucket. This is the part people are nervous about, and they should not be.",
          "If there are deals in that column, Chumley asks you where they should go before it removes anything. It suggests the column to its left, which is usually right, and you can pick any other one. Nothing is deleted. The deals move, then the column goes.",
          "If the column is empty it just goes, with no question, because there is nothing to decide.",
        ],
        image: {
          src: "/support/delete-bucket.png",
          alt: "The delete bucket dialog asking which column the deals should move to",
        },
      },
      {
        title: "Two things it will not let you do",
        say: [
          "You cannot delete Won or Lost. Every board needs somewhere for finished deals to land, and the dashboard numbers are built on them.",
          "You cannot delete your last working column either. A board with nowhere to put a live deal is not a board, so Chumley keeps at least one.",
        ],
      },
    ],
    gotcha: {
      title: "The mistake almost everybody makes",
      say: [
        "Building nine columns in the first week. It feels thorough and it is the fastest way to end up back in a spreadsheet.",
        "Every extra column is a decision you have to make about every single deal, several times a week, forever. Nine columns means a board you avoid opening because updating it is a chore. Four or five is plenty for most people, and the honest test is whether you could explain to somebody else exactly what has to happen for a deal to move from one column to the next. If you cannot, that column is decoration.",
        "Start with what you have, work it for two weeks, and add a column only when you notice deals piling up at a step the board does not show.",
      ],
    },
    outro:
      "Click a name to rename it, drag the handle to reorder, three dot menu to delete, and deleting always asks where the deals go. Make it look like how you actually sell, then leave it alone.",
    related: ["add-your-first-lead", "import-leads-from-a-spreadsheet"],
  },
  {
    slug: "add-your-first-lead",
    title: "Add your first lead and move it across the board",
    description:
      "The ninety second version of using Chumley: add a deal, give it a next step, and drag it to the next column when it moves.",
    minutes: 2,
    topic: "Getting started",
    hook: "If you only ever learn one thing about Chumley, learn this. A lead is a card, the card sits in a column, and you move it right when the deal moves forward. That is the whole product.",
    beats: [
      {
        title: "Add a deal",
        image: {
          src: "/support/add-a-deal.png",
          alt: "The Add a deal dialog, asking for name, phone and email",
        },
        say: [
          "Open the pipeline and hit Add a deal. It asks for a name, a phone number and an email, and that is on purpose. Those three things are everything you need to start working somebody. Company, value, job title, all of that is optional and you can fill it in later, or never.",
          "There is a Where does this go question underneath. That picks which column the card lands in. If you are not sure, leave it on the first one. Moving it later takes one drag.",
        ],
      },
      {
        title: "Give it a next step",
        image: {
          src: "/support/lead-detail.png",
          alt: "A lead open, showing the next step field and its due date",
        },
        say: [
          "Open the card and you will see a field called Next step. Type what you are actually going to do and put a date on it. Call him back Thursday. Send the quote. Whatever it is.",
          "This is the part that earns the subscription, so do not skip it. When that date passes, the card turns red on your board. You will see it without looking for it, which is the difference between following up and meaning to follow up.",
        ],
      },
      {
        title: "Call, text or email from the card",
        say: [
          "The card has buttons for call, text and email. Tap call and your phone dials. When you come back, Chumley asks how it went and logs the call with the time on it.",
          "There is a one line box there if you want it. Left voicemail, call back Tuesday. That is the right amount to write. You are not filing a report, you are leaving yourself a note for three weeks from now when you have forgotten the whole conversation.",
        ],
      },
      {
        title: "Move it when it moves",
        say: [
          "On a computer, drag the card to the next column. On a phone, flick it right and it advances. That is the entire pipeline mechanic.",
          "The columns are yours, by the way. If your process has a step called Waiting on permits, add a column and call it that. Nothing about the board assumes you sell software.",
        ],
      },
    ],
    gotcha: {
      title: "The mistake almost everybody makes",
      say: [
        "People add twenty leads on day one and give none of them a next step. Then the board looks busy, nothing turns red, and two weeks later it is a list of names again.",
        "A lead with no next step is not in your pipeline. It is in your memory, which is where it was before you signed up. Give every card a next step, even if the next step is just decide whether this is real.",
      ],
    },
    outro:
      "That is it. Add a deal, give it a next step, move it when it moves. Everything else in Chumley is a convenience on top of those three things.",
    related: ["import-leads-from-a-spreadsheet"],
  },
  {
    slug: "import-leads-from-a-spreadsheet",
    title: "Import your leads from a spreadsheet",
    description:
      "Bring an existing list into Chumley in about two minutes, including the one file format thing that trips people up.",
    minutes: 2,
    topic: "Getting started",
    hook: "You already have a list. It is in a spreadsheet, or it is an export from the CRM you are leaving. You should not have to retype it, and you do not have to.",
    beats: [
      {
        title: "Save it as CSV first",
        say: [
          "This is the step people miss, so I am putting it first. Chumley reads CSV files. It does not read xlsx, which is what Excel and Google Sheets save by default.",
          "In Excel, File, Save As, and pick CSV. In Google Sheets, File, Download, Comma separated values. It takes five seconds and it is the difference between this working and you emailing me.",
        ],
      },
      {
        title: "Upload it",
        say: [
          "Go to Settings, then Import leads. Pick your file. Chumley reads the first row as your column headers, so make sure row one is headers and not your first customer.",
        ],
      },
      {
        title: "Check the columns it guessed",
        image: {
          src: "/support/import-mapping.png",
          alt: "The import screen asking which spreadsheet column is which field",
        },
        say: [
          "Now you get a screen called Which column is which, and Chumley has already had a go at matching them. It knows that a column called Full Name, or Contact, or Lead Name is a name. It knows that Mobile and Cell and Work Phone are all phone numbers. Most of the time the guesses are right.",
          "Your job is to read down the list and fix the ones that are wrong. Anything you do not want, set it to Skip this column. You do not have to import everything just because it is in the file.",
          "You can map First name and Last name separately if your export has them split. There is a field for company, email, phone, job title, deal value, the stage it should land in, a next step with a due date, and notes.",
        ],
      },
      {
        title: "Import it",
        say: [
          "Hit import and it runs. It tells you how many rows went in, and then you can go straight to the pipeline and look at them.",
          "If the mapping came out wrong, the fastest fix is usually to delete what came in, fix the spreadsheet, and run it again. That is less work than correcting two hundred cards by hand.",
        ],
      },
    ],
    gotcha: {
      title: "The mistake almost everybody makes",
      say: [
        "Importing a thousand names and calling it a pipeline. It is not. It is a contact list, and a contact list is not the thing that makes you money.",
        "Your pipeline should be the handful of deals actually in play right now. So import the list by all means, but then go and put a next step on the ten or fifteen that are live. Those are the ones the board is for.",
      ],
    },
    outro:
      "Save it as CSV, upload it, check the guesses, import. The whole thing is about two minutes as long as you do the CSV part first.",
    related: ["add-your-first-lead", "add-the-lead-form-to-your-website"],
  },
  {
    slug: "cancel-or-change-your-plan",
    title: "Cancel or change your plan",
    description:
      "Cancel in one click from inside the app, add or remove seats, and understand what happens to your data afterwards. Nothing is deleted and you can always export it.",
    minutes: 3,
    topic: "Billing",
    hook: "You can cancel Chumley yourself, in one click, from inside the app. Nobody is going to try to talk you out of it, there is no retention call, and you do not have to email anyone. Here is exactly what happens when you do.",
    beats: [
      {
        title: "Where all of this lives",
        say: [
          "Settings, then Billing. Everything to do with money is on that one page. What you are paying, how many seats you have, changing that number, and cancelling.",
          "You are billed per person, per month. If you are on your own that is one seat, and one seat is the whole bill.",
        ],
        image: {
          src: "/support/billing.png",
          alt: "The Chumley billing page, with the seat control ringed",
        },
      },
      {
        title: "Cancelling",
        say: [
          "One button on that page. It asks you to confirm and that is the end of it.",
          "Your plan does not stop that second. It stops at the end of the month you have already paid for, and you keep working normally until then. We do not offer a cancel-right-now-and-give-me-the-rest-back option, because you paid for that month and taking it off you the moment you press a button is not a favour.",
          "You can undo it any time before that date, from the same page. If you cancel on the second and change your mind on the twentieth, click resume and nothing ever happened.",
        ],
      },
      {
        title: "What happens to your data",
        say: [
          "Nothing is deleted. Not on the day you cancel, not on the day it takes effect.",
          "After the date, your board becomes read-only. Everything is still there, your deals, your contacts, your notes, your whole history. You can open it, read it, and search it. You just cannot add or change anything until you subscribe again.",
          "You can export the lot to a spreadsheet at any point, before or after. Your data is not the thing we hold over you to make you stay, and if you come back in six months it is all exactly where you left it.",
        ],
      },
      {
        title: "Adding or removing seats",
        say: [
          "Same page. Change the number and Chumley works out the money before you commit to anything, showing you what you are charged today and what your bill becomes after that.",
          "Adding somebody part way through a month costs a part month, not a full one. Removing somebody takes effect at your next renewal, and the seat keeps working until then, because you already paid for it.",
        ],
      },
      {
        title: "Refunds",
        say: [
          "There is a thirty day money-back guarantee on your first payment. If you pay, use it properly, and decide it is not for you, tell us inside thirty days and we refund the whole thing. You do not have to justify it.",
          "After that first month it works the way most software does. A renewal or a seat charge can be refunded within fourteen days, and further if the law where you live says so. Ask, and if it is fair we will sort it out.",
          "Refunds go back the way they came, to the card you paid with, and they take a few days to appear because that part is the bank's timetable rather than ours.",
        ],
      },
    ],
    gotcha: {
      title: "The one that catches people out",
      say: [
        "Look at your bank statement and you will not see the word Chumley. You will see PADDLE.NET.",
        "That is not a mistake and it is not a scam. Paddle is our merchant of record, which means they are legally the seller and they handle the payment, the sales tax and the invoicing. Plenty of software you already use works the same way. But if you have forgotten that, an unfamiliar charge is exactly the sort of thing you report to your bank as fraud.",
        "Please do not do that first. A dispute takes the money out of our hands and into a process that is slower for both of us, and once it is open we cannot simply refund you, which is what you actually wanted. Email us instead and we will sort it out the same day. If you genuinely cannot place a charge, we can tell you what it was for in about a minute.",
      ],
    },
    outro:
      "Cancel yourself from Settings and Billing, keep working until the month you paid for runs out, and undo it any time before then. Nothing is deleted, your board goes read-only rather than dark, and you can export everything whenever you like.",
    related: ["add-your-first-lead", "edit-your-pipeline-columns"],
  },
  {
    slug: "lead-notification-emails",
    title: "Get an email the moment a lead comes in",
    description:
      "Chumley emails you when somebody fills in your website form, with their number and a link straight to the deal. Here is what it sends, who gets it, and how to switch it off.",
    minutes: 3,
    topic: "Leads from your website",
    hook: "A lead landing silently on a board you are not looking at is the same as no lead. So when somebody fills in your form, Chumley emails you, with their phone number in it, so you can call them back while they are still sitting at their computer thinking about it.",
    beats: [
      {
        title: "It is already on",
        say: [
          "You do not have to set this up. New accounts have it switched on, because the alternative is finding out on Thursday that somebody enquired on Monday.",
          "The switch lives in Settings, on the page for your website form, under Tell me when a lead comes in. That is also where you turn it off, if you ever want to.",
        ],
        image: {
          src: "/support/lead-notifications.png",
          alt: "The Chumley settings page showing the Tell me when a lead comes in section, ringed",
        },
      },
      {
        title: "What lands in your inbox",
        say: [
          "The subject line is the person's name, because that is all you can read on a lock screen without unlocking your phone. Something like: New lead, Dale Whitaker at Whitaker Mechanical.",
          "Inside there is one sentence saying who came in and where from, their phone number, their email, and a link that says Open the deal. That link goes straight to their card on your board, already open. Not to your dashboard, not to a login screen you then have to navigate out of.",
          "That is the whole email. There is no digest, no scoring, no summary of your week. You are meant to read the subject, tap the number, and call them.",
        ],
      },
      {
        title: "Which leads trigger it",
        say: [
          "Anything that arrives on its own. Your hosted form page, the form embedded on your website, a plain HTML form posting to us, and the webhook if you have wired one up through Zapier or Make.",
          "It deliberately does not fire when you add a lead yourself. You were there. You typed it in. Emailing you about something you just did is how a useful notification turns into one you filter into a folder and stop reading.",
        ],
      },
      {
        title: "A busy hour only sends one email",
        say: [
          "If five enquiries arrive in ten minutes, you get one email, not five. Ten quiet minutes have to pass before the next one goes out.",
          "The next email tells you what you missed. The subject becomes something like Rosa Nunez and three more new leads, and the body says how many came in while you were away and reminds you that they are all on your board.",
          "This is on purpose, and it is worth understanding, because the first time it happens it looks like leads went missing. They did not. Every single one is on your pipeline. What is throttled is the emailing, not the capturing. A phone that buzzes five times in ten minutes gets silenced, and a silenced phone is worse than one email.",
        ],
      },
      {
        title: "Who gets it",
        say: [
          "The account owner. One address, the person who set the account up.",
          "Worth knowing if you have people on your team, because a rep waiting for these will not get them. Website leads arrive with nobody attached to them yet, so there is no obvious rep to notify, and guessing wrong is worse than not guessing. If your reps need to see new enquiries, point them at the board rather than their inbox.",
        ],
      },
      {
        title: "Turning it off",
        say: [
          "Same switch, in Settings, on your website form page. Turn it off and the leads still arrive exactly as before. You just will not hear about them until you look at your board.",
          "Every notification also has a line at the bottom telling you where that switch is, so you never have to come back here to find it.",
        ],
      },
    ],
    gotcha: {
      title: "The mistake almost everybody makes",
      say: [
        "Trusting it without ever testing it. The first one of these you receive is a message from a domain your email provider has never seen before, and a decent share of the time the first one goes to spam.",
        "You will not notice, because nothing looks broken. The form works, the lead is on the board, and the email you never knew to expect is sitting in a folder you never open. Then one day you wonder why you stopped getting them.",
        "Two minutes fixes it, today. Go and fill in your own form with your real name and a fake email address. When the notification arrives, check whether it landed in spam, and if it did, mark it as not spam and add the sender to your contacts. Then delete the test lead off your board. That is the whole job, and it is the difference between a system you trust and one you merely hope is working.",
      ],
    },
    outro:
      "It is on already, it goes to the account owner, it fires for anything that arrives on its own, and a busy hour is batched into one email rather than five. Go and test it once, so you know what it looks like before it matters.",
    related: ["add-the-lead-form-to-your-website", "add-your-first-lead"],
  },
  {
    slug: "add-the-lead-form-to-your-website",
    title: "Put the lead form on your website",
    description:
      "Paste one line of code and leads from your website land on your board automatically, with an email to tell you they arrived.",
    minutes: 2,
    topic: "Leads from your website",
    hook: "If somebody fills in a form on your website, that lead should already be on your board by the time you hear about it. Here is how to wire that up, and it is one line of code.",
    beats: [
      {
        title: "Get your code",
        image: {
          src: "/support/website-form.png",
          alt: "The website form settings page with the one line embed code ringed",
        },
        say: [
          "Go to Settings, then the website form page. There is a section called The code with a single line in it. Copy it.",
          "That line is yours specifically. It has a token in it that tells Chumley which account the lead belongs to, so do not share it around or paste somebody else's.",
        ],
      },
      {
        title: "Paste it into your website",
        say: [
          "Put it wherever you want the form to appear. On WordPress that is a Custom HTML block. On Squarespace it is an Embed block, on Wix it is Embed HTML, and if somebody built your site for you, send them the line and say put this where the contact form goes.",
          "It works the same on all of them because it is just a script tag. There is no plugin to install and nothing to keep updated.",
        ],
      },
      {
        title: "Make it match your website",
        say: [
          "Under Make it match your website there are a few settings. You can set the accent colour so the button matches your brand, change the heading, change the button text, and change what it says after somebody submits.",
          "Here is the part worth knowing. All of that lives in your Chumley settings, not in the code on your site. So when you want to change the heading a year from now, you change it here and your website updates on its own. You never have to go back and re-paste anything, and you never have to ask your web guy for a favour.",
        ],
      },
      {
        title: "Turn on the email",
        say: [
          "There is a setting called Tell me when a lead comes in. Turn it on. A lead landing silently on a board you are not looking at is the same as no lead.",
          "It sends you a note with their name and number and a link straight to the card, so you can call them back from your phone without going hunting.",
        ],
      },
    ],
    gotcha: {
      title: "The mistake almost everybody makes",
      say: [
        "Pasting the code, seeing the form appear, and never testing it. Fill it in yourself, right now, with your own name and a fake email. It takes ten seconds.",
        "Then go and look at your pipeline and make sure the card is there. That one test is the difference between knowing it works and hoping it does, and hoping it does is how you find out in March that it broke in January.",
      ],
    },
    outro:
      "One line of code, a few settings that you control from Chumley rather than from your website, and an email when somebody comes in. Test it once and then forget about it.",
    related: ["add-your-first-lead"],
  },
];

export function articleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** The hub groups by topic, in this order. */
export const TOPICS: Article["topic"][] = [
  "Calling",
  "Getting started",
  "Day to day",
  "Leads from your website",
  "Billing",
];
