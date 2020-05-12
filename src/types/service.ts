import { Message } from '@line/bot-sdk';

/**
 * An interface that defines a COVID-related services
 */
export interface COVIDService {
  (): Promise<Message>;
}
