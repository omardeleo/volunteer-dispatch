require("dotenv").config();
const Slack = require("slack");
const token = process.env.SLACK_XOXB;
const channel = process.env.SLACK_CHANNEL_ID;
const bot = new Slack({ token });

// This function actually sends the message to the slack channel
const sendMessage = (record, volunteers) => {
  const text = "A new errand has been added!";
  const heading = getSection(`:exclamation: *${text}* :exclamation:`);
  const requester = getRequester(record);
  const tasks = getTasks(record);
  const subsidyRequested = subsidyIsRequested(record);
  const language = getLanguage(record);
  const requestedTimeframe = getTimeframe(record);
  const space = getSection(" ");
  const volunteerList = getVolunteers(volunteers);

  return bot.chat.postMessage({
    token,
    channel,
    text,
    blocks: [
      heading,
      requester,
      tasks,
      subsidyRequested,
      language,
      requestedTimeframe,
      space
    ],
    attachments: [
      {
        blocks: volunteerList
      }
    ]
  });
};

const getRequester = record => {
  const recordURL = `${process.env.AIRTABLE_REQUESTS_SHEET_URL}/${record.id}`;
  const textLines = [
    `<${recordURL}|${record.get("Name")}>`,
    record.get("Phone number"),
    record.get("Address")
  ];
  const text = textLines.join("\n");

  const requesterObject = getSection(text);

  return requesterObject;
};

const getTasks = record => {
  const tasks = formatTasks(record);
  const tasksObject = getSection(`*Needs assistance with:*${tasks}`);

  return tasksObject;
};

const subsidyIsRequested = record => {
  const subsidy = record.get(
    "Please note, we are a volunteer-run organization, but may be able to help offset some of the cost of hard goods. Do you need a subsidy for your assistance?"
  )
    ? ":white_check_mark:"
    : ":no_entry_sign:";

  const subsidyObject = getSection(`*Subsidy requested:* ${subsidy}`);

  return subsidyObject;
};

const getLanguage = record => {
  const languages = [record.get("Language"), record.get("Language - other")];

  const languageList = languages
    .reduce((list, language) => {
      if (language) list.push(language);
      return list;
    }, [])
    .join(", ");

  console.log(languageList);

  const languageObject = getSection(
    `*Speaks:* ${languageList.length ? languageList : "None specified"}`
  );

  console.log(languageObject);

  return languageObject;
};

const getTimeframe = record => {
  const timeframe = record.get("Timeframe");
  const timeframeObject = getSection(`*Requested timeframe:* ${timeframe}`);

  return timeframeObject;
};

const formatTasks = record => {
  let formattedTasks = "";
  const tasks = record.get("Tasks");

  // Put each task on a new line
  if (tasks) {
    formattedTasks = record
      .get("Tasks")
      .reduce((msg, task) => `${msg}\n :small_orange_diamond: ${task}`, "");
  }

  return formattedTasks;
};

const getVolunteers = volunteers => {
  const volObject = [];

  if (volunteers.length > 0) {
    // Heading for volunteers
    volObject.push(getSection("*Here are the 10 closest volunteers*"));

    // Prepare the detailed volunteer info
    volunteers.forEach(volunteer => {
      const volunteerURL = `${process.env.AIRTABLE_VOLUNTEERS_SHEET_URL}/${volunteer.record.id}`;
      const volunteerText = `<${volunteerURL}|${volunteer.Name}> - ${
        volunteer.Number
      } - ${volunteer.Distance.toFixed(2)} Mi.`;

      volObject.push(getSection(volunteerText));
    });

    // Add phone number list for copy/paste
    const msg = "Here are the volunteer phone numbers for easy copy/pasting:";
    const phoneText = [msg].concat(volunteers.map(v => v.Number)).join("\n");

    volObject.push(getSection(phoneText));
  } else {
    // No volunteers found
    const noneFoundText =
      "*No volunteers match this request!*\n*Check the full Airtable record, there might be more info there.*";

    volObject.push(getSection(noneFoundText));
  }

  return volObject;
};

const getSection = text => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text
    }
  };
};

module.exports = {
  sendMessage
};
