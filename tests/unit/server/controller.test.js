import { beforeEach, jest, expect, describe, test } from "@jest/globals";
import config from "../../../server/config.js";
import TestUtil from './_util/testUtil.js';
import { handler } from "../../../server/routes.js";
import { Controller } from '../../../server/controller.js';
import { Service } from '../../../server/service.js';


describe("#controller - test suit for API control", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });


  test('getFileStream - should return a file stream', async () => {
    const filename = "/index.html";
    const mockFileStream = TestUtil.generateReadableStream(['data']);
    const expectedType = '.html';

    jest.spyOn(
      Service.prototype,
      Service.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    const controller = new Controller();
    const controllerReturn = await controller.getFileStream(filename)

    expect(Service.prototype.getFileStream).toBeCalledWith(filename);
    expect(controllerReturn).toStrictEqual({
      stream: mockFileStream,
      type: expectedType
    })
  })

  test("getFileStream - Should response with audio stream", async () =>  {
    const mockStream = TestUtil.generateReadableStream(['teste']);
    const mockId = "1";

    jest.spyOn(
      Service.prototype,
      Service.prototype.createClientStream.name
    ).mockReturnValue({
      id: mockId,
      clientStream: mockStream
    })

    jest.spyOn(
      Service.prototype,
      Service.prototype.removeClientStream.name
    ).mockReturnValue()

    const controller = new Controller();
    const {onClose, stream} = controller.createClientStream();

    onClose()

    expect(stream).toStrictEqual(mockStream);
    expect(Service.prototype.removeClientStream).toHaveBeenCalledWith(mockId);
    expect(Service.prototype.createClientStream).toHaveBeenCalled();

  })

  describe('#handleCommand', () => {
    test("command stop", async () => {
      jest.spyOn(
        Service.prototype,
        Service.prototype.stopStreaming.name
      ).mockResolvedValue();

      const controller = new Controller();

      const data = {
        command : "stop"
      }

      const result = await controller.handleCommand(data);
      expect(result).toStrictEqual({
        result: "ok"
      })

      expect(Service.prototype.stopStreaming).toHaveBeenCalled()
    })


    test("command start", async () => {
      jest.spyOn(
        Service.prototype,
        Service.prototype.startStreaming.name
      ).mockResolvedValue();

      const controller = new Controller();

      const data = {
        command : "START"
      }

      const result = await controller.handleCommand(data);
      expect(result).toStrictEqual({
        result: "ok"
      })

      expect(Service.prototype.startStreaming).toHaveBeenCalled()
    })

    test.skip("non existing command", async () => {

      jest.spyOn(
        Service.prototype,
       'startStreaming'
      ).mockResolvedValue();

      const controller = new Controller();

      const data = {
        command : "NON EXISTING"
      }

      const result = await controller.handleCommand(data);
      expect(result).toStrictEqual({
        result: "ok"
      }) //test

      expect(Service.prototype.startStreaming).not.toHaveBeenCalled()
    })
  })
})