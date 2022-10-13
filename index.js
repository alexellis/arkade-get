const core = require('@actions/core');
const wait = require('./wait');

const schema = require("./schema.json")
const exec = require('@actions/exec');

// most @actions toolkit packages have async methods
async function run() {
  try {


    for(i = 0; i < len(schema); i++){
      let tool = schema[i].name
      let toolValue = core.getInput(tool);

      if(toolValue) {
        core.info("Installing: " + tool + " with " + toolValue)

        await exec.exec('arkade get ' + tool + ' --version ' + toolValue)
      }
    }

    core.setOutput('tools', len(schema) + " tools were installed");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
