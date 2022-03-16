import {beforeEach, jest, expect, test, describe} from "@jest/globals";
import { Controller } from "../../../server/controller";
import { Service } from "../../../server/service";
import TestUtil from "./_util/testUtil";

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
})