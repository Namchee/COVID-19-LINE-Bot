import { Message } from '@line/bot-sdk';
import { get } from 'superagent';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { utcToZonedTime } from 'date-fns-tz';
import reply from './reply.json';

/**
 * Small utility function to format date into a usual Indonesian datetime format
 *
 * @param {string} date Date string, must be parseable
 */
function formatUpdateString(date: string): string {
  const dateObj = new Date(date);

  const zonedTime = utcToZonedTime(dateObj, 'Asia/Jakarta');

  return `${format(
    zonedTime,
    'cccc, d MMMM Y kk:mm',
    { locale: id },
  )} WIB`;
}

export async function handleA(): Promise<Message> {
  return {
    type: 'text',
    text: reply.data.what,
  };
}

export async function handleB(): Promise<Message> {
  return {
    type: 'text',
    text: reply.data.how,
  };
}

export async function handleC(): Promise<Message> {
  return {
    type: 'text',
    text: reply.data.todo,
  };
}

export async function handleD(): Promise<Message> {
  const endpoint = process.env.API_URL || '';

  const result = await get(endpoint);

  const text =
    `Berikut merupakan perkembangan persebaran COVID-19 di Indonesia:
  
Jumlah Terkonfirmasi: ${result.body.confirmed.value}
Jumlah Sembuh: ${result.body.recovered.value}
Jumlah Kematian: ${result.body.deaths.value}
  
Terakhir diupdate pada ${formatUpdateString(result.body.lastUpdate)}`;

  return {
    type: 'text',
    text,
  };
}

export async function handleE(): Promise<Message> {
  return {
    type: 'text',
    text: reply.data.contact,
  };
}
