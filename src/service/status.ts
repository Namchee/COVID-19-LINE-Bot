import { COVIDService, ServiceResult } from '../types/service';
import { utcToZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { get } from 'superagent';

interface APIResultDetail {
  value: number;
  detail: string;
}

interface APIResult {
  confirmed: APIResultDetail;
  recovered: APIResultDetail;
  deaths: APIResultDetail;
  lastUpdate: string; // ISO date string
}

export class StatusService extends COVIDService {
  public constructor(serviceId: string) {
    super(serviceId);
  }

  public handleQuery = async (): Promise<ServiceResult> => {
    const data = await this.fetchData();

    const text =
      `Berikut merupakan perkembangan persebaran COVID-19 di Indonesia:
  
Jumlah Terkonfirmasi: ${this.formatDecimal(data.confirmed.value)}
Jumlah Sembuh: ${this.formatDecimal(data.recovered.value)}
Jumlah Kematian: ${this.formatDecimal(data.deaths.value)}
  
Terakhir diupdate pada ${this.formatUpdateString(data.lastUpdate)}`;
    return {
      step: 0,
      messages: [{
        type: 'text',
        text,
      }],
    };
  }

  private fetchData = async (): Promise<APIResult> => {
    const endpoint = process.env.API_URL || '';

    return (await get(endpoint)).body as APIResult;
  }

  private formatUpdateString = (date: string): string => {
    const dateObj = new Date(date);

    const zonedTime = utcToZonedTime(dateObj, 'Asia/Jakarta');

    return `${format(
      zonedTime,
      'cccc, d MMMM Y kk:mm',
      { locale: id },
    )} WIB`;
  }

  /**
   * Copied from StackOverflow: https://stackoverflow.com/a/61994179/11202771
   */
  private formatDecimal = (number: number): string => {
    return number.toString().replace(
      /(\d)(?=(\d{3})+(?!\d))/g, '$1.',
    );
  }
}
