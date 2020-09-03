const robots = {
  text: require("./textRobot"),
  input: require("./inputRobot"),
  state: require("./stateRobot"),
};

async function start() {
  robots.input();
  await robots.text();

  const content = robots.state.load();
  console.dir(content.sentences, { depth: null });
}

start();
