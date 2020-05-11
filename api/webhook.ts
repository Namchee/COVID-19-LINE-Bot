import crypto from 'crypto';
import Redis from 'ioredis';
import { NowRequest, NowResponse } from '@now/node';
import { Client } from '@line/bot-sdk';
import { BotHub, BotService } from '../src/hub';
import { handleA, handleB, handleC, handleD, handleE } from './../src/services';

let botHub: BotHub;

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

  const serviceMap = new Map<string, BotService>([
    ['a', handleA],
    ['b', handleB],
    ['c', handleC],
    ['d', handleD],
    ['e', handleE],
  ]);

  botHub = new BotHub(redisClient, lineClient, serviceMap);

  return botHub;
}

async function verifyLineSignature(
  signature: string,
  requestBody: any,
): Promise<void> {
  const channelSecret = process.env.CHANNEL_SECRET || '';
  const body = JSON.stringify(requestBody);

  const generatedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(body).digest('base64');

  if (signature !== generatedSignature) {
    throw new Error('Invalid signature');
  }
}

export default async function handleWebhookEvent(
  req: NowRequest,
  res: NowResponse,
): Promise<NowResponse> {
  try {
    await verifyLineSignature(
      req.headers['x-line-signature'] as string,
      req.body,
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
