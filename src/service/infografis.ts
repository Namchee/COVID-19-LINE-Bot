import { COVIDService, ServiceResult } from '../types/service';

export class InforgrafisService extends COVIDService {
  public constructor(serviceId: string) {
    super(serviceId);
  }

  public handleQuery = async (): Promise<ServiceResult> => {
    return {
      step: 0,
      messages: [
        {
          type: 'text',
          text: 'Don\'t',
        },
      ],
    };
  };
}
