import {
  Client,
  WebhookEvent,
  MessageAPIResponseBase,
  Message,
  TextMessage,
  QuickReplyItem,
} from '@line/bot-sdk';
import { Redis } from 'ioredis';
import reply from './reply.json';

export type Service = () => Promise<Message>;

export class BotHub {
  private static readonly QUICK_REPLIES = {
    items: [
      BotHub.generateQuickReplyObject('A', 'A'),
      BotHub.generateQuickReplyObject('B', 'B'),
      BotHub.generateQuickReplyObject('C', 'C'),
      BotHub.generateQuickReplyObject('D', 'D'),
      BotHub.generateQuickReplyObject('E', 'E'),
      BotHub.generateLocationAction('location test'),
    ],
  };

  public constructor(
    private readonly redis: Redis,
    private readonly client: Client,
    private readonly serviceMap: Map<string, Service>,
  ) { }

  public handleBotQuery = async (
    event: WebhookEvent,
  ): Promise<MessageAPIResponseBase | null> => {
    if (event.type === 'message' && event.message.type === 'location') {
      console.log(event.message);
    }

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
      const understandable = reply.greetings.some(
        greeting => text.toLowerCase() === greeting,
      );

      if (understandable) {
        await this.redis.setex(source, Number(process.env.EXPIRATION_TIME), 0);
      }

      const message: TextMessage = {
        type: 'text',
        text: understandable ?
          reply.reply.greeting :
          reply.reply.fallback_reply,
        quickReply: understandable ? BotHub.QUICK_REPLIES : undefined,
      };

      return await this.client.replyMessage(event.replyToken, message);
    }

    if (reply.endings.some(end => text.toLowerCase() === end)) {
      await this.redis.del(source);

      const message: TextMessage = {
        type: 'text',
        text: reply.reply.end,
      };

      return await this.client.replyMessage(event.replyToken, message);
    }

    const service = this.serviceMap.get(text.toLowerCase());

    if (!service) {
      const errorMessage: TextMessage = {
        type: 'text',
        text: reply.reply.fallback_stateful,
      };

      await this.client.replyMessage(
        event.replyToken,
        errorMessage,
      );
    } else {
      const serviceMessage = await service();

      await this.redis.setex(source, Number(process.env.EXPIRATION_TIME), 0);
      await this.client.pushMessage(
        source,
        serviceMessage,
      );
    }

    return await this.sendLoopMessage(source);
  }

  private sendLoopMessage = (
    source: string,
  ): Promise<MessageAPIResponseBase> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const quickReply = JSON.parse(JSON.stringify(BotHub.QUICK_REPLIES));
        quickReply.items.push(
          BotHub.generateQuickReplyObject('Akhiri', 'cukup'),
        );

        const message: TextMessage = {
          type: 'text',
          text: reply.reply.repeat,
          quickReply,
        };

        resolve(await this.client.pushMessage(source, message));
      }, 2000);
    });
  }

  private static generateQuickReplyObject(
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

  private static generateLocationAction(
    label: string,
  ): QuickReplyItem {
    return {
      type: 'action',
      action: {
        type: 'location',
        label,
      },
    };
  }
}
