const algorithmia = require("algorithmia");
const {
  apikey: algorithmiaApiKey,
} = require("../credentials/algorithmia.json");
const sentenceBoundaryDetection = require("sbd");
const { apikey: watsonApiKey } = require("../credentials/watson-nlu.json");
const NaturalLanguageUnderstantingV1 = require("watson-developer-cloud/natural-language-understanding/v1");

const nlu = new NaturalLanguageUnderstantingV1({
  iam_apikey: watsonApiKey,
  version: "2018-04-05",
  url: "https://gateway.watsonplatform.net/natural-language-understanding/api/",
});

const robots = {
  state: require("../stateRobot"),
};

module.exports = async function robot() {
  const content = robots.state.load();
  await fetchContentFromWikipedia(content);
  sanitizeContent(content);
  breakContentIntoSentences(content);
  limitMaximumSentences(content);
  await fetchKeyWordsOfAllSentences(content);
  robots.state.save(content);

  async function fetchContentFromWikipedia(content) {
    const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey);
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo(
      "web/WikipediaParser/0.1.2"
    );
    console.log({
      lang: content.language,
      articleName: content.searchTerm,
    });
    const wikipediaResponse = await wikipediaAlgorithm.pipe({
      lang: content.language,
      articleName: content.searchTerm,
    });
    const wikipediaContent = wikipediaResponse.get();
    content.souceContentOriginal = wikipediaContent.content;
  }

  function sanitizeContent(content) {
    const withoutBlankLinesAndMarkdown = removeBlackLinesAndMarkdown(
      content.souceContentOriginal
    );
    const withoutDatesInParentheses = removeDatesInParentheses(
      withoutBlankLinesAndMarkdown
    );
    content.souceContentSanitized = withoutDatesInParentheses;

    function removeBlackLinesAndMarkdown(text) {
      const allLines = text.split("\n");
      const withoutBlankLinesAndMarkdown = allLines.filter(
        (line) => line.trim() !== "" && !line.trim().startsWith("=")
      );
      return withoutBlankLinesAndMarkdown.join(" ");
    }

    function removeDatesInParentheses(text) {
      return text
        .replace(/\((?:\([^()]*\)|[^()])*\)/gm, "")
        .replace(/  /gm, "");
    }
  }

  function breakContentIntoSentences(content) {
    content.sentences = [];
    const sentences = sentenceBoundaryDetection.sentences(
      content.souceContentSanitized
    );
    sentences.forEach((sentence) =>
      content.sentences.push({
        text: sentence,
        keywords: [],
        images: [],
      })
    );
  }

  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences);
  }

  async function fetchKeyWordsOfAllSentences(content) {
    await Promise.all(
      content.sentences.map(async (sentence) => {
        sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);
      })
    );
  }

  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu.analyze(
        {
          text: sentence,
          features: { keywords: {} },
        },
        (err, response) => {
          if (err) throw err;
          const keywords = response.keywords.map((keyword) => keyword.text);
          resolve(keywords);
        }
      );
    });
  }
};
