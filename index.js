const readLine = require("readline-sync");
const robots = { text: require("./textRobot") };

async function start() {
  const state = {};

  state.searchTerm = askAndReturnSearchTerm();
  state.prefix = askAndReturnPrefix();

  await robots.text(state);

  function askAndReturnSearchTerm() {
    return readLine.question("Type a Wikipedia search term: ");
  }

  function askAndReturnPrefix() {
    const prefixes = ["Who is", "What is", "The history of"];
    const selectedPrefixIndex = readLine.keyInSelect(
      prefixes,
      "Choose one option: "
    );

    //If user Cancel operation
    if (selectedPrefixIndex === -1) process.exit();

    const selectedPrefixText = prefixes[selectedPrefixIndex];

    return selectedPrefixText;
  }

  //   console.log(state);
}

start();
