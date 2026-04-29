import fetch from 'node-fetch'

const res = await fetch('https://api.mercadolibre.com/sites/MLB/search?q=camisa+flamengo&limit=3', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
  }
})

const data = await res.json()
console.log(JSON.stringify(data, null, 2))