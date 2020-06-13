import { Message, MessageEvent, WebhookEvent } from '@line/bot-sdk';

export interface ServiceResult {
  step: number;
  messages: Message[];
}

export interface ServiceFunctions {
  (event: MessageEvent): Promise<Message[]>;
}

export abstract class COVIDService {
  public readonly serviceId: string;

  public constructor(serviceId: string) {
    this.serviceId = serviceId;
  }

  public abstract handleQuery({
    event,
    step,
  }: {
    event: WebhookEvent;
    step: number;
  }): Promise<ServiceResult>;
}
