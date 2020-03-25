import {
  Client,
  WebhookEvent,
  MessageAPIResponseBase,
  Message,
  TextMessage,
  QuickReplyItem,
} from '@line/bot-sdk';
import { Redis } from 'ioredis';
import { get } from 'superagent';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { utcToZonedTime } from 'date-fns-tz';
import {
  GREETINGS,
  ENDS,
  GREETING_REPLY,
  FALLBACK_REPLY,
  END_REPLY,
  REPEAT_REPLY,
  FALLBACK_STATEFUL_REPLY,
} from './reply';

function generateQuickReplyObject(
  label: string,
  text: string,
): QuickReplyItem {
  return {
    type: 'action',
    action: {
      type: 'message',
      label,
      text,
    },
  };
}

type DataFetcher = () => Promise<Message>;

export class COVIDService {
  private readonly serviceMap: Map<string, DataFetcher>;
  private static QUICK_REPLIES = {
    items: [
      generateQuickReplyObject('A', 'A'),
      generateQuickReplyObject('B', 'B'),
    ],
  };

  public constructor(
    private readonly redis: Redis,
    private readonly client: Client,
  ) {
    this.serviceMap = new Map();
    this.serviceMap.set('A', this.handleA);
    this.serviceMap.set('B', this.handleB);
    this.serviceMap.set('a', this.handleA);
    this.serviceMap.set('b', this.handleB);
  }

  public handleBotQuery = async (
    event: WebhookEvent,
  ): Promise<MessageAPIResponseBase | null> => {
    if (event.source.type !== 'user' ||
      event.type !== 'message' ||
      event.message.type !== 'text'
    ) {
      return Promise.resolve(null);
    }

    const source = event.source.userId;
    const state = await this.redis.get(source);
    const text = event.message.text;

    if (state === null) {
      const understandable = GREETINGS.some(
        greeting => text.toLowerCase() === greeting,
      );

      if (understandable) {
        await this.redis.setex(source, Number(process.env.EXPIRATION_TIME), 0);
      }

      const message: TextMessage = {
        type: 'text',
        text: understandable ? GREETING_REPLY : FALLBACK_REPLY,
      };

      return await this.client.replyMessage(event.replyToken, message);
    }

    if (ENDS.some(end => text.toLowerCase() === end)) {
      await this.redis.del(source);

      const message: TextMessage = {
        type: 'text',
        text: END_REPLY,
      };

      return await this.client.replyMessage(event.replyToken, message);
    }

    const service = this.serviceMap.get(text);
    const repeatMessage: TextMessage = {
      type: 'text',
      text: REPEAT_REPLY,
      quickReply: COVIDService.QUICK_REPLIES,
    };

    if (!service) {
      const errorMessage: TextMessage = {
        type: 'text',
        text: FALLBACK_STATEFUL_REPLY,
      };

      return await this.client.pushMessage(
        event.replyToken,
        [errorMessage, repeatMessage],
      );
    }

    const serviceMessage = await service();

    await this.redis.setex(source, Number(process.env.EXPIRATION_TIME), 0);
    return await this.client.pushMessage(
      event.replyToken,
      [serviceMessage, repeatMessage],
    );
  }

  private handleA = async (): Promise<Message> => {
    const endpoint = process.env.API_URL || '';

    const result = await get(endpoint);

    const text =
    `Berikut merupakan perkembangan COVID-19 di Indonesia:
    
Jumlah Terkonfirmasi: ${result.body.confirmed.value}
Jumlah Sembuh: ${result.body.recovered.value}
Jumlah Kematian: ${result.body.deaths.value}
    
Terakhir diupdate pada ${this.getUpdateString(result.body.lastUpdate)}`;

    return {
      type: 'text',
      text,
    };
  }

  private handleB = async (): Promise<Message> => {
    const endpoint = process.env.API_URL || '';

    return {
      type: 'image',
      originalContentUrl: `${endpoint}/og`,
      previewImageUrl: `${endpoint}/og`,
    };
  }

  private getUpdateString = (lastUpdate: string): string => {
    const date = new Date(lastUpdate);

    const zonedTime = utcToZonedTime(date, 'Asia/Jakarta');

    return format(
      zonedTime,
      'cccc, d MMMM Y kk:mm',
      { locale: id },
    ) + ' WIB';
  }
}
