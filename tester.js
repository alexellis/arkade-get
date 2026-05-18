import os from 'node:os'
import path from 'node:path'

function getDownloadArch(arch) {
  if (arch === 'x64') {
    return 'amd64'
  } else if (arch === 'x86') {
    return 'amd64'
  }
}

async function getDownloadUrl() {
  const response = await fetch("https://github.com/alexellis/arkade/releases/latest", {
    method: "HEAD",
    redirect: "manual",
    signal: AbortSignal.timeout(2500),
  })
  if (response.status !== 302) {
    throw new Error(`unexpected status ${response.status} resolving latest arkade release`)
  }
  const tag = response.headers.get("location")
  // https://github.com/alexellis/arkade/releases/tag/0.9.17
  let arch = getDownloadArch(os.arch())

  return `${tag}/arkade-${arch}`
}

getDownloadUrl().then(d => {
  console.log(d)
  console.log(path.basename(d))
  console.log(path.dirname(d))
})
