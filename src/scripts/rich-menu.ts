import { Client, RichMenu } from '@line/bot-sdk';
import { createReadStream } from 'fs';
import { config } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  config();
}

if (!process.env.CHANNEL_ACCESS_TOKEN || !process.env.CHANNEL_SECRET) {
  throw new Error('LINE token doesn\'t exist');
}

const client = new Client({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
});

const richMenu: RichMenu = {
  size: {
    width: 1500,
    height: 1000,
  },
  selected: true,
  name: 'COVID-19 quick access',
  chatBarText: 'Tap to Open',
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 500,
        height: 500,
      },
      action: {
        type: 'postback',
        data: 'a',
      },
    },
    {
      bounds: {
        x: 500,
        y: 0,
        width: 500,
        height: 500,
      },
      action: {
        type: 'postback',
        data: 'b',
      },
    },
    {
      bounds: {
        x: 1000,
        y: 0,
        width: 500,
        height: 500,
      },
      action: {
        type: 'postback',
        data: 'c',
      },
    },
    {
      bounds: {
        x: 0,
        y: 500,
        width: 500,
        height: 500,
      },
      action: {
        type: 'postback',
        data: 'd',
      },
    },
    {
      bounds: {
        x: 500,
        y: 500,
        width: 500,
        height: 500,
      },
      action: {
        type: 'postback',
        data: 'f',
      },
    },
    {
      bounds: {
        x: 1000,
        y: 500,
        width: 500,
        height: 500,
      },
      action: {
        type: 'postback',
        data: 'g',
      },
    },
  ],
};

(async (): Promise<void> => {
  try {
    const id = await client.createRichMenu(richMenu);

    await client.setRichMenuImage(
      id,
      createReadStream('./public/rich-menu.png'),
    );

    await client.setDefaultRichMenu(id);
  } catch (err) {
    console.error(err);

    throw err;
  }
})();
