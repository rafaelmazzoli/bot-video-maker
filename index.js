const robots = {
  text: require("./textRobot"),
  input: require("./inputRobot"),
  state: require("./stateRobot"),
  image: require("./imageRobot"),
};

async function start() {
  robots.input();
  await robots.text();
  await robots.image();

  const content = robots.state.load();
  console.dir(content.sentences, { depth: null });
}

start();
