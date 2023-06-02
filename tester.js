const os = require('os')
const axios = require('axios')
const path = require('path')

function getDownloadArch(arch) {
  if (arch === 'x64') {
    return 'amd64'
  } else if (arch === 'x86') {
    return 'amd64'
  }
}

async function getDownloadUrl() {
  let tag = "latest"
  let response = null
  try {
    response = await axios({
      url: "https://github.com/alexellis/arkade/releases/latest",
      maxRedirects: 0,
      method: "head",
      timeout: 2500,
      validateStatus: function (status) {
        return status == 302
      }
    })
    tag = response.headers.location;
  } catch (error) {
      throw error
  }
  // https://github.com/alexellis/arkade/releases/tag/0.9.17
  let arch = getDownloadArch(os.arch())

  return `${tag}/arkade-${arch}`
}

getDownloadUrl().then(d => {
  console.log(d)
  console.log(path.basename(d))
  console.log(path.dirname(d))
})
