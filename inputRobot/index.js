const readLine = require("readline-sync");
const robots = {
  state: require("../stateRobot"),
};

module.exports = function robot() {
  const content = {
    maximumSentences: 7,
  };

  content.searchTerm = askAndReturnSearchTerm();
  content.language = askAndReturnLanguage();
  content.prefix = askAndReturnPrefix(content.language);
  robots.state.save(content);

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
};
