const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');

async function getHospitals() {
  const obj = {};
  const response = await superagent.get('https://www.sehatq.com/artikel/daftar-rumah-sakit-untuk-penanganan-virus-corona-covid-19');

  const $ = cheerio.load(response.text);

  $('h3').each((i, value) => {
    const children = value.children;

    if (children.length === 1 && children[0].name === 'strong') {
      const provincee = children[0].children[0].data.toLowerCase();
      const hospitals = [];

      let next = value.next;

      while (next && next.name !== 'h3') {
        const pattern = /^\d+\./;

        if (pattern.test(next.children[0].data)) {
          hospitals.push(next.children[0].data.replace(/^\d+\.\s/, ''));
        }

        next = next.next.next;
      }

      obj[provincee] = hospitals;
    }
  });

  return obj;
}

getHospitals().then((result) => {
  fs.writeFileSync('./hospitals.json', JSON.stringify(result, null, 2));
});
