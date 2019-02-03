const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const Table = require('cli-table')
var net = require('net')
var Promise = require('bluebird')

function checkConnection(host, port, timeout) {
  return new Promise(function(resolve, reject) {
    timeout = timeout || 10000 // default of 10 seconds
    var timer = setTimeout(function() {
      reject('timeout')
      socket.end()
    }, timeout)
    var socket = net.createConnection(port, host, function() {
      clearTimeout(timer)
      resolve()
      socket.end()
    })
    socket.on('error', function(err) {
      clearTimeout(timer)
      reject(err)
    })
  })
}

let table = new Table()

const output = scores => {
  Object.keys(scores).forEach(category => {
    table.push([category, scores[category]])
  })
  return table.toString()
}

function launchChromeAndRunLighthouse(url, opts = {}, config = null) {
  return chromeLauncher
    .launch({ chromeFlags: opts.chromeFlags })
    .then(chrome => {
      opts.port = chrome.port
      return lighthouse(url, opts, config).then(results => {
        return chrome.kill().then(() => results)
      })
    })
}

test('performance audit', async () => {
  checkConnection('localhost', 9000)
    .then(() => {})
    .catch(err => {
      console.warn(
        'Performance not tested due to server not being available',
        err
      )
      return
    })
  const { lhr } = await launchChromeAndRunLighthouse('http://localhost:9000')

  const scores = Object.keys(lhr.categories).reduce((merged, category) => {
    merged[category] = lhr.categories[category].score
    return merged
  }, {})

  console.log(output(scores))

  expect(scores.performance).toBe(1)
  expect(scores.accessibility).toBe(1)
  expect(scores['best-practices']).toBeGreaterThanOrEqual(0.93)
  expect(scores.seo).toBe(1)
}, 20000)
