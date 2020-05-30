import {
  Client,
  WebhookEvent,
  MessageAPIResponseBase,
  TextMessage,
  QuickReplyItem,
} from '@line/bot-sdk';
import { Redis } from 'ioredis';
import reply from './reply.json';
import { COVIDService } from './types/service';

/**
 * A class which defines a hub to map request to correct services
 */
export class BotHub {
  private static readonly QUICK_REPLIES = {
    items: [
      BotHub.generateQuickReplyObject('A', 'A'),
      BotHub.generateQuickReplyObject('B', 'B'),
      BotHub.generateQuickReplyObject('C', 'C'),
      BotHub.generateQuickReplyObject('D', 'D'),
      BotHub.generateQuickReplyObject('E', 'E'),
      BotHub.generateQuickReplyObject('F', 'F'),
      BotHub.generateQuickReplyObject('Akhiri', 'cukup'),
    ],
  };

  public constructor(
    private readonly redis: Redis,
    private readonly client: Client,
    private readonly serviceMap: Map<string, COVIDService>,
  ) { }

  /**
   * Function to handle user queries and reply with proper answer(s)
   */
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
          reply.base_fallback + reply.reply.fallback_reply,
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
        text: reply.base_fallback,
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

    return await this.sendLINEMessage(source);
  }

  /**
   * A function to format response to a LINE-compliant message
   */
  private sendLINEMessage = (
    source: string,
  ): Promise<MessageAPIResponseBase> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const quickReply = JSON.parse(JSON.stringify(BotHub.QUICK_REPLIES));

        const message: TextMessage = {
          type: 'text',
          text: reply.reply.repeat,
          quickReply,
        };

        resolve(await this.client.pushMessage(source, message));
      }, 2500);
    });
  }

  /**
   * A wrapper function to create a QuickReplyItem
   *
   * @param {string} label Item's label (a text which shown to the user)
   * @param {string} text Text to be sent to user when the item is clicked
   */
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
}
