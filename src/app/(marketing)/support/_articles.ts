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
  };
};

export type Article = {
  slug: string;
  /** The H1, and the video title. Written to be searched for. */
  title: string;
  description: string;
  /** Roughly how long this runs spoken, in minutes. */
  minutes: number;
  /** Which group it sits under on the hub. */
  topic: "Calling" | "Getting started" | "Day to day" | "Leads from your website";
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
          columns: ["Clicking Call does this", "What it needs"],
          rows: [
            {
              label: "iPhone",
              values: ["Confirms, then dials", "Nothing, it is built in"],
            },
            {
              label: "Android",
              values: ["Dialer opens, number filled in", "Nothing, it is built in"],
            },
            {
              label: "Mac or iPad",
              values: [
                "FaceTime relays the call through your iPhone",
                "An iPhone on the same Apple ID, nearby, with Calls from iPhone switched on",
              ],
            },
            {
              label: "Windows, nothing installed",
              values: ["Usually nothing at all", "One of the rows below"],
            },
            {
              label: "Windows with Phone Link",
              values: [
                "Calls out through your paired phone",
                "Phone Link, paired with your handset",
              ],
            },
            {
              label: "Microsoft Teams",
              values: [
                "Teams opens. Whether it can reach a normal phone number depends on your licence",
                "Teams Phone plus a calling plan. Plain Teams cannot dial regular numbers",
              ],
            },
            {
              label: "RingCentral, Aircall, Dialpad, Zoom Phone, OpenPhone",
              values: [
                "Their desktop app opens and dials over the internet",
                "A paid seat, and their desktop app installed",
              ],
            },
            {
              label: "Google Voice",
              values: [
                "Depends. Voice runs in a browser tab rather than claiming the job system-wide",
                "Their Chrome extension, or copy the number across by hand",
              ],
            },
          ],
        },
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
        say: [
          "Open the pipeline and hit Add a deal. It asks for a name, a phone number and an email, and that is on purpose. Those three things are everything you need to start working somebody. Company, value, job title, all of that is optional and you can fill it in later, or never.",
          "There is a Where does this go question underneath. That picks which column the card lands in. If you are not sure, leave it on the first one. Moving it later takes one drag.",
        ],
      },
      {
        title: "Give it a next step",
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
];
