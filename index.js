const core = require('@actions/core');
const exec = require('@actions/exec');
const schema = require("./schema.json")

// most @actions toolkit packages have async methods
async function run() {
  try {

    let added = 0
    for(i = 0; i < schema.length; i++){
      let tool = schema[i]
      tool = tool.replace(/_/g, "-")

      let toolValue = core.getInput(tool);

      if(toolValue && toolValue.length) {
        core.info("Installing: " + tool + " with " + toolValue)

        if(toolValue == "latest") {
          await exec.exec('arkade get ' + tool)
        } else {
          await exec.exec('arkade get ' + tool + ' --version ' + toolValue)
        }

        added++
      }
    }

    core.setOutput('tools', added+ " tools were installed");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
