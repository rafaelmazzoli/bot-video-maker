const google = require("googleapis").google;
const customSearch = google.customsearch("v1");
const googleSearchCredentials = require("../credentials/google-search.json");
const robots = {
  state: require("../stateRobot"),
};

module.exports = async function robot() {
  const content = robots.state.load();
  await fetchImagesOfAllSentences(content);
  robots.state.save(content);

  async function fetchImagesOfAllSentences(content) {
    await Promise.all(
      content.sentences.map(async (sentence) => {
        const query = `${content.searchTerm} ${sentence.keywords[0]}`;
        sentence.images = await fetchGoogleAndReturnImagesLinks(query);
        sentence.googleSearchQuery = query;
      })
    );
  }

  async function fetchGoogleAndReturnImagesLinks(query) {
    const response = await customSearch.cse.list({
      //For more options:
      //https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list
      auth: googleSearchCredentials.apikey,
      cx: googleSearchCredentials.searchEngineId,
      q: query,
      searchType: "image",
      imgSize: ["large"],
      num: 2,
    });
    const imagesUrl = response.data.items.map((item) => item.link);
    return imagesUrl;
  }
};
