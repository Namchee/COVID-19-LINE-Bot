import { get } from 'superagent';
import { config } from 'dotenv';
import { writeFileSync, existsSync } from 'fs';
import { strictEqual } from 'assert';
import { Hospital } from '../types/model';

interface ArcGisData {
  attributes: Hospital;
}

/**
 * Get official hospitals data and write it to a JSON file
 */
(async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      config();
    }

    if (!process.env.RS_URL) {
      throw new Error('Hospitals data doesn\'t exist');
    }

    const rawData: string = (await get(process.env.RS_URL)).text;
    const data: ArcGisData[] = JSON.parse(rawData).features;

    const hospitals: Hospital[] = data.map((hospitalData: ArcGisData) => {
      return hospitalData.attributes;
    });

    writeFileSync(
      './public/hospitals.json',
      JSON.stringify(hospitals, null, 2),
    );

    strictEqual(true, existsSync('./public/hospitals.json'));
  } catch (err) {
    console.error(err.message);

    throw err; // re-throw
  }
})();
