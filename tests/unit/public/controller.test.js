import{jest, beforeEach, test, describe, expect} from '@jest/globals';

import Controller from '../../../public/controller/js/controller';

describe('#Controller ~ test suit for controller calls', () => {
  const deps = {
    view: {
      configureOnBtnClick: jest.fn(),
      onLoad: jest.fn()
    },
    service: {
      makeRequest: jest.fn().mockRejectedValue()
    }
  };


  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  })

  test('#onLoad', () => {
    const controller = new Controller(deps);
    controller.onLoad();

    jest.spyOn(
      controller.commandReceived,
      controller.commandReceived.bind.name
    )

    const [call] = deps.view.configureOnBtnClick.mock.lastCall;

    expect(call.name).toStrictEqual(controller.commandReceived.bind(controller).name);
    expect(deps.view.onLoad).toHaveBeenCalled();
  })

  test('#commandReceived', async () => {
    const controller = new Controller(deps);

    const data = 'hey';

    await controller.commandReceived(data);

    const expectCall = {
      command: data
    }

    expect(deps.service.makeRequest).toHaveBeenCalledWith(expectCall);
  })

  test('#Initialize', () => {
    
    jest.spyOn(
      Controller.prototype,
    Controller.prototype.onLoad.name
    ).mockReturnValue()

    const controller = Controller.initialize(deps);
    const controllerConstructor = new Controller(deps);

    expect(Controller.prototype.onLoad).toHaveBeenCalled();
    expect(controller).toStrictEqual(controllerConstructor);

  })
})