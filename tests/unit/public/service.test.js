import {expect,jest,test,beforeEach, describe} from '@jest/globals';
import Service from '../../../public/controller/js/service.js';

describe('#Service ~ Test suit for service call', () => {

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  })

  test('#MakeRequest', async () => {
    const url = 'localhost:3000'
    const controller = new Service({
      url
    })

    const jsonResult = jest.fn().mockResolvedValue();
    global.fetch = jest.fn().mockResolvedValue({json: jsonResult});

    const data = {
      test: 123
    }

    await controller.makeRequest(data);

    expect(global.fetch).toHaveBeenCalledWith(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })

    expect(jsonResult).toHaveBeenCalled();
    
  })
})