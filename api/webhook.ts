import crypto from 'crypto';
import Redis from 'ioredis';
import { NowRequest, NowResponse } from '@now/node';
import { Client } from '@line/bot-sdk';
import { COVIDService } from './../src/types/service';
import { BotHub } from '../src/hub';
import {
  handleA,
  handleB,
  handleC,
  handleD,
  handleE,
  handleF,
} from '../src/services';

let botHub: BotHub;

/**
 * Setup serverless dependency from cold start
 */
function setupDependency(): BotHub {
  if (botHub) {
    return botHub;
  }

  const redisClient = new Redis(
    Number(process.env.REDIS_PORT),
    process.env.REDIS_URL,
    {
      password: process.env.REDIS_PASSWORD,
    },
  );

  const lineClient = new Client({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.CHANNEL_SECRET,
  });

  const serviceMap = new Map<string, COVIDService>([
    ['a', handleA],
    ['b', handleB],
    ['c', handleC],
    ['d', handleD],
    ['e', handleE],
    ['f', handleF],
  ]);

  botHub = new BotHub(redisClient, lineClient, serviceMap);

  return botHub;
}

/**
 * Verify a LINE request signature
 *
 * @param {string} signature Signature string, which is defined on
 * request header
 * @param {string} requestBody Stringfied request body
 */
async function verifyLineSignature(
  signature: string,
  requestBody: string,
): Promise<void> {
  const channelSecret = process.env.CHANNEL_SECRET || '';

  const generatedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(requestBody).digest('base64');

  if (signature !== generatedSignature) {
    throw new Error('Invalid signature');
  }
}

/**
 * Handles a LINE webhook event and respond approriately
 *
 * @param {NowRequest} req Request object
 * @param {NowResponse} res Response object
 */
export default async function handleWebhookEvent(
  req: NowRequest,
  res: NowResponse,
): Promise<NowResponse> {
  try {
    await verifyLineSignature(
      req.headers['x-line-signature'] as string,
      JSON.stringify(req.body),
    );

    const hub = setupDependency();

    const result = await Promise.all(
      req.body.events.map(hub.handleBotQuery),
    );

    return res.status(200)
      .json(result);
  } catch (err) {
    return res.status(500)
      .json(err.message);
  }
}
