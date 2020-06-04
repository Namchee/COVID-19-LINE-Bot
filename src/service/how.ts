import { COVIDService, ServiceResult } from '../types/service';
import replies from './../../public/replies.json';

export class HowService extends COVIDService {
  public constructor(serviceId: string) {
    super(serviceId);
  }

  public handleQuery = async (): Promise<ServiceResult> => {
    return {
      step: 0,
      messages: [{
        type: 'text',
        text: replies.data.how,
      }],
    };
  }
}
