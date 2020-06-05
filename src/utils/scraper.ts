import { get } from 'superagent';
import { writeFileSync, existsSync, unlinkSync } from 'fs';
import assert from 'assert';
import { Hospital } from '../types/model';

interface ArcGisData {
  attributes: Hospital;
}

/**
 * Get official hospitals data and write it to a JSON file
 */
async function getHospitalsData(): Promise<void> {
  if (existsSync('./public/hospitals.json')) {
    unlinkSync('./public/hospitals.json');
  }

  if (!process.env.RS_URL) {
    throw new Error('Hospitals source does not exists');
  }

  const rawData: string = (await get(process.env.RS_URL)).text;
  const data: ArcGisData[] = JSON.parse(rawData).features;

  const hospitals: Hospital[] = data.map((hospitalData: ArcGisData) => {
    return hospitalData.attributes;
  });

  writeFileSync('./public/hospitals.json', JSON.stringify(hospitals, null, 2));
}

getHospitalsData()
  .then(() => {
    assert.strictEqual(true, existsSync('./public/hospitals.json'));
  })
  .catch((err: Error) => {
    console.error(err.message);
    throw err; // re-throw
  });
