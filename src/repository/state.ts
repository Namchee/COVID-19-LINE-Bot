import { Redis } from 'ioredis';
import { State } from '../types/state';

export class StateRepository {
  public constructor(private readonly redis: Redis) {}

  public getState = async (
    key: string,
  ): Promise<State | null> => {
    const state = await this.redis.get(key);

    return state ?
      JSON.parse(state) as State :
      null;
  }

  public setState = async (
    key: string,
    state: State,
  ): Promise<boolean> => {
    const res = await this.redis.setex(
      key,
      Number(process.env.EXPIRATION_TIME),
      JSON.stringify(state),
    );

    return res === 'OK';
  }

  public deleteState = async (
    key: string,
  ): Promise<boolean> => {
    const res = await this.redis.del(key);

    return res === 1;
  }
}
