const imageDownloader = require("image-downloader");
const gm = require("gm").subClass({ imageMagick: true });
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
  await convertAllImages(content);
  await createAllSentenceImages(content);
  await createYouTubeThumbnail();
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
      // imgSize: ["huge", "xlarge", "xxlarge", "large"],
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
              throw new Error(`Image has already been downloaded`);

            await downloadAndSaveImage(
              imageUrl,
              `${sentenceIndex}-original.png`
            );
            content.downloadedImages.push(imageUrl);
            console.log(
              `> [${sentenceIndex}][${imageIndex}] Image Downloaded: ${imageUrl}`
            );
            break;
          } catch (err) {
            console.log(
              `> [${sentenceIndex}][${imageIndex}] Error on Image Download: ${imageUrl}`
            );
          }
        }
      })
    );
  }

  async function downloadAndSaveImage(url, fileName) {
    return await imageDownloader.image({
      url,
      dest: `./content/images/${fileName}`,
    });
  }

  async function convertAllImages(content) {
    await Promise.all(
      content.sentences.map(async (sentence, index) => {
        await convertImage(index);
      })
    );
  }

  async function convertImage(sentenceIndex) {
    return new Promise((resolve, reject) => {
      const inputFile = `./content/images/${sentenceIndex}-original.png[0]`;
      const outputFile = `./content/images/${sentenceIndex}-converted.png`;
      const width = 1920;
      const height = 1080;

      gm()
        .in(inputFile)
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-blur", "0x9")
        .out("-resize", `${width}x${height}^`)
        .out(")")
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-resize", `${width}x${height}`)
        .out(")")
        .out("-delete", "0")
        .out("-gravity", "center")
        .out("-compose", "over")
        .out("-composite")
        .out("-extent", `${width}x${height}`)
        .write(outputFile, (error) => {
          if (error) return reject(error);
          console.log(`> Image converted: ${inputFile}`);
          resolve();
        });
    });
  }

  async function createAllSentenceImages(content) {
    await Promise.all(
      content.sentences.map(async (sentence, index) => {
        await createSentenceImage(index, sentence.text);
      })
    );
  }

  async function createSentenceImage(sentenceIndex, sentenceText) {
    return new Promise((resolve, reject) => {
      const outputFile = `./content/images/${sentenceIndex}-sentence.png`;

      const templateSettings = {
        0: {
          size: "1920x400",
          gravity: "center",
        },
        1: {
          size: "1920x1080",
          gravity: "center",
        },
        2: {
          size: "800x1080",
          gravity: "west",
        },
        3: {
          size: "1920x400",
          gravity: "center",
        },
        4: {
          size: "1920x1080",
          gravity: "center",
        },
        5: {
          size: "800x1080",
          gravity: "west",
        },
        6: {
          size: "1920x400",
          gravity: "center",
        },
      };

      gm()
        .out("-size", templateSettings[sentenceIndex].size)
        .out("-gravity", templateSettings[sentenceIndex].gravity)
        .out("-background", "transparent")
        .out("-fill", "white")
        .out("-kerning", "-1")
        .out(`caption:${sentenceText}`)
        .write(outputFile, (error) => {
          if (error) return reject(error);
          console.log(`> Sentence created: ${outputFile}`);
          resolve();
        });
    });
  }

  async function createYouTubeThumbnail() {
    return new Promise((resolve, reject) => {
      gm()
        .in("./content/images/0-converted.png")
        .write("./content/images/youtube-thumbnail.jpg", (error) => {
          if (error) return reject(error);
          console.log("> Creating YouTube thumbnail");
          resolve();
        });
    });
  }
};
