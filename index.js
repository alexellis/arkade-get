const core = require('@actions/core');
const exec = require('@actions/exec');
const schema = require("./schema.json")

// most @actions toolkit packages have async methods
async function run() {
  try {

    let added = 0
    for(i = 0; i < schema.length; i++){
      let tool = schema[i]
      // inputName = tool.replace(/-/g, "_")
      let inputName = tool;
      let toolValue = core.getInput(inputName);


      if(toolValue && toolValue.length) {
        core.info("Installing: " + tool + " with " + toolValue)

        if(toolValue == "latest") {
          await exec.exec('arkade get --progress=false --quiet=true ' + tool)
        } else {
          await exec.exec('arkade get --progress=false --quiet=true ' + tool + ' --version ' + toolValue)
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
