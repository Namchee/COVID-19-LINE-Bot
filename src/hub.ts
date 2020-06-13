import {
  Client,
  WebhookEvent,
  MessageEvent,
  MessageAPIResponseBase,
  TextMessage,
  QuickReplyItem,
  FollowEvent,
  PostbackEvent,
} from '@line/bot-sdk';
import replies from './../public/replies.json';
import { COVIDService } from './types/service';
import { StateRepository } from './repository/state';
import { sleep } from './utils/functions';
import { State } from './types/state';

/**
 * A class which defines a hub to map request to correct services
 */
export class BotHub {
  /**
   * Quick reply objects
   */
  private readonly quickReplies = {
    items: [] as QuickReplyItem[],
  };

  /**
   * Constructor for BotHub.
   * Dynamically inserts all mapped services
   */
  public constructor(
    private readonly client: Client,
    private readonly stateRepository: StateRepository,
    private readonly serviceMap: Map<string, COVIDService>,
  ) {
    for (const service of serviceMap.keys()) {
      this.quickReplies.items.push(
        BotHub.generateQuickReplyObject(service.toUpperCase(), service),
      );
    }

    this.quickReplies.items.push(
      BotHub.generateQuickReplyObject('Akhiri', 'Cukup'),
    );
  }

  /**
   * Function to handle user queries and reply with proper answer(s)
   */
  public handleBotQuery = async (
    event: WebhookEvent,
  ): Promise<MessageAPIResponseBase | null> => {
    // ignore the event if it's not from LINE user
    // ignore unsupported events
    if (event.source.type !== 'user' ||
      !(
        event.type === 'message' ||
        event.type === 'follow' ||
        event.type === 'postback'
      )
    ) {
      return Promise.resolve(null);
    }

    const source = event.source.userId;
    const state = await this.stateRepository.getState(source);

    if (event.type === 'message') {
      return this.handleMessageEvent(state, source, event);
    } else if (event.type === 'postback') {
      return this.handlePostbackEvent(state, source, event);
    }

    return this.handleFollowEvent(event);
  }

  /**
   * Sends another prompt message after 2 seconds
   */
  private sendPromptMessage = async (
    source: string,
  ): Promise<MessageAPIResponseBase> => {
    await this.stateRepository.setState( // lock
      source,
      {
        serviceId: '',
        step: -1,
      },
    );

    await sleep(2000);

    await this.stateRepository.setState( // unlock
      source,
      {
        serviceId: '',
        step: 0,
      },
    );

    const message: TextMessage = {
      type: 'text',
      text: replies.reply.repeat + replies.base_message,
      quickReply: this.quickReplies,
    };

    return this.client.pushMessage(source, message);
  }

  /**
   * A wrapper function to create a QuickReplyItem
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

  /**
   * Handles any text message event
   */
  private handleMessageEvent = async (
    state: State | null,
    source: string,
    event: MessageEvent,
  ): Promise<MessageAPIResponseBase | null> => {
    if (!state) {
      if (event.message.type !== 'text') {
        return this.sendErrorMessage(source);
      }

      const text = event.message.text.toLowerCase();
      const understandable = replies.greetings.some(
        greeting => text.toLowerCase() === greeting,
      );

      if (understandable) {
        await this.stateRepository.setState(
          source,
          {
            serviceId: '',
            step: 0,
          },
        );
      }

      const message: TextMessage = {
        type: 'text',
        text: understandable ?
          replies.reply.greeting + replies.base_message :
          replies.base_fallback + replies.reply.fallback_reply,
        quickReply: understandable ? this.quickReplies : undefined,
      };

      return this.client.replyMessage(event.replyToken, message);
    }

    // ignore command spam
    if (state.step === -1) {
      return Promise.resolve(null);
    }

    let service: COVIDService | undefined;

    // expect A-F and terminator
    if (state.step === 0) {
      await this.stateRepository.setState(
        source,
        {
          serviceId: '',
          step: 0,
        },
      );

      if (event.message.type !== 'text') {
        await this.sendErrorMessage(source, false);
        return this.sendPromptMessage(source);
      }

      const text = event.message.text.toLowerCase();

      if (replies.endings.some(word => word === text)) {
        await this.stateRepository.deleteState(source);

        return this.client.replyMessage(
          event.replyToken,
          {
            type: 'text',
            text: replies.reply.end,
          },
        );
      }

      service = this.serviceMap.get(text);
    } else {
      service = this.serviceMap.get(state.serviceId);
    }

    if (!service) {
      await this.sendErrorMessage(source);
      return this.sendPromptMessage(source);
    }

    const res = await service.handleQuery({ event, step: state.step });
    const messages = res.messages;

    if (res.step === 0) {
      await this.client.pushMessage(source, messages);
      return this.sendPromptMessage(source);
    } else {
      await this.stateRepository.setState(
        source,
        {
          serviceId: service.serviceId,
          step: res.step,
        },
      );

      return this.client.pushMessage(source, messages);
    }
  }

  /**
   * Sends a greeting message when a user adds the OA
   */
  private handleFollowEvent = async (
    event: FollowEvent,
  ): Promise<MessageAPIResponseBase> => {
    return this.client.replyMessage(
      event.replyToken,
      {
        type: 'text',
        text: replies.reply.initial_greeting,
      },
    );
  }

  public handlePostbackEvent = async (
    state: State | null,
    source: string,
    event: PostbackEvent,
  ): Promise<MessageAPIResponseBase | null> => {
    if (!state || !state.step) {
      const text = event.postback.data;

      const service = this.serviceMap.get(text) as COVIDService;

      const res = await service.handleQuery({ event, step: 0 });
      const messages = res.messages;

      if (res.step === 0) {
        await this.client.pushMessage(source, messages);
        return this.sendPromptMessage(source);
      } else {
        await this.stateRepository.setState(
          source,
          {
            serviceId: service.serviceId,
            step: res.step,
          },
        );

        return this.client.pushMessage(source, messages);
      }
    }

    return Promise.resolve(null);
  }

  private sendErrorMessage = async (
    source: string,
    first = true,
  ): Promise<MessageAPIResponseBase> => {
    let text = replies.base_fallback;

    if (first) {
      text += replies.reply.fallback_reply;
    }

    const textMessage: TextMessage = {
      type: 'text',
      text,
    };

    return this.client
      .pushMessage(source, textMessage);
  }
}
