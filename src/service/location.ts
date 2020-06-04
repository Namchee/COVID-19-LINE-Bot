import {
  COVIDService,
  ServiceResult,
  ServiceFunctions,
} from '../types/service';
import { MessageEvent, Message } from '@line/bot-sdk';
import { Hospital, Place } from '../types/model';
import replies from './../../public/replies.json';
import hospitalData from './../../public/hospitals.json';

export class LocationService extends COVIDService {
  private readonly serviceHandler: ServiceFunctions[];

  public constructor(serviceId: string) {
    super(serviceId);

    this.serviceHandler = [
      this.handleFirstState,
      this.handleSecondState,
    ];
  }

  public handleQuery = async (
    { event, step }: { event: MessageEvent; step: number },
  ): Promise<ServiceResult> => {
    try {
      return {
        step: (step + 1 === this.serviceHandler.length) ? 0 : step + 1,
        messages: await this.serviceHandler[step](event),
      };
    } catch (err) {
      const prompt = await this.serviceHandler[step - 1](event);

      return {
        step,
        messages: [
          {
            type: 'text',
            text: err.message,
          },
          ...prompt,
        ],
      };
    }
  }

  private handleFirstState = async (): Promise<Message[]> => {
    return [
      {
        type: 'text',
        text: replies.reply.location.first,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'location',
                label: 'Kirim Lokasi Saya',
              },
            },
          ],
        },
      },
    ];
  }

  private handleSecondState = async (
    event: MessageEvent,
  ): Promise<Message[]> => {
    if (event.message.type !== 'location') {
      throw new Error(replies.reply.location.not_location);
    }

    const hospital: Hospital = this.getBestHospital(
      event.message.latitude,
      event.message.longitude,
    );

    const textMessage: Message = {
      type: 'text',
      /* eslint-disable max-len */
      text: `Rumah sakit rujukan COVID-19 yang terdekat dari lokasi anda saat ini adalah ${hospital.nama}
      
🏥: ${hospital.alamat}
${hospital.telepon ? '📞: ' + hospital.telepon : '' }`,
    };

    const locationMessage: Message = {
      type: 'location',
      latitude: hospital.lat,
      longitude: hospital.lon,
      title: hospital.nama,
      address: hospital.alamat,
    };

    return [textMessage, locationMessage];
  }

  private getBestHospital = (lat: number, lon: number): Hospital => {
    let bestHospital: Hospital = hospitalData[0];
    let bestDistance = this.haversineDistance(
      { lat, lon },
      { lat: bestHospital.lat, lon: bestHospital.lon },
    );

    for (let i = 1; i < hospitalData.length; i++) {
      const distance = this.haversineDistance(
        { lat, lon },
        { lat: hospitalData[i].lat, lon: hospitalData[i].lon },
      );

      if (distance < bestDistance) {
        bestHospital = hospitalData[i];
        bestDistance = distance;
      }
    }

    return bestHospital;
  }

  /**
   * Calculate distance between to geographical point
   */
  private haversineDistance = (source: Place, destination: Place): number => {
    const radius = 6371e3;
    const phiSource = source.lat * Math.PI / 180;
    const phiDest = destination.lat * Math.PI / 180;
    const deltaPhi = Math.abs(destination.lat - source.lat) * Math.PI / 180;
    const deltaLambda = Math.abs(destination.lon - source.lon) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phiSource) * Math.cos(phiDest) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radius * c;
  }
}
