const imageDownloader = require("image-downloader");
const google = require("googleapis").google;
const customSearch = google.customsearch("v1");
const googleSearchCredentials = require("../credentials/google-search.json");
const robots = {
  state: require("../stateRobot"),
};

module.exports = async function robot() {
  const content = robots.state.load();
  await fetchImagesOfAllSentences(content);
  await downloadAllImages(content);
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
      imgType: "photo",
      num: 3,
    });
    const imagesUrl = response.data.items.map((item) => item.link);
    return imagesUrl;
  }

  async function downloadAllImages(content) {
    content.downloadedImages = [];
    await Promise.all(
      content.sentences.map(async (sentence, sentenceIndex) => {
        const { images } = sentence;
        for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
          const imageUrl = images[imageIndex];
          try {
            if (content.downloadedImages.includes(imageUrl))
              throw new Error(`Imagem ja foi baixada`);

            await downloadAndSaveImage(
              imageUrl,
              `${sentenceIndex}-original.png`
            );
            content.downloadedImages.push(imageUrl);
            console.log(
              `> [${sentenceIndex}][${imageIndex}] Baixou imagem: ${imageUrl}`
            );
            break;
          } catch (err) {
            console.log(
              `> [${sentenceIndex}][${imageIndex}] Erro ao baixar: ${imageUrl}`
            );
          }
        }
      })
    );
  }

  async function downloadAndSaveImage(url, fileName) {
    return await imageDownloader.image({
      url,
      dest: `./imageRobot/images/${fileName}`,
    });
  }
};
