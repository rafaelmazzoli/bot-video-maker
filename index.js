const readLine = require("readline-sync");
const robots = { text: require("./textRobot") };

async function start() {
  const state = {
    maximumSentences: 7,
  };

  state.searchTerm = askAndReturnSearchTerm();
  state.language = askAndReturnLanguage();
  state.prefix = askAndReturnPrefix(state.language);

  await robots.text(state);

  function askAndReturnSearchTerm() {
    return readLine.question("Type a Wikipedia search term: ");
  }

  function askAndReturnLanguage() {
    const languages = ["pt", "en"];
    const selectedLanguageIndex = readLine.keyInSelect(
      languages,
      "Choose the Language of the Search: "
    );

    //If user Cancel operation
    if (selectedLanguageIndex === -1) process.exit();

    const selectedLanguageText = languages[selectedLanguageIndex];

    return selectedLanguageText;
  }

  function askAndReturnPrefix(language = "en") {
    const prefixes = {
      pt: ["Quem é", "O que é", "A história do(a)"],
      en: ["Who is", "What is", "The history of"],
    };
    const selectedPrefixIndex = readLine.keyInSelect(
      prefixes[language],
      "Choose one option: "
    );

    //If user Cancel operation
    if (selectedPrefixIndex === -1) process.exit();

    const selectedPrefixText = prefixes[language][selectedPrefixIndex];

    return selectedPrefixText;
  }

  console.log(state.sentences);
}

start();
