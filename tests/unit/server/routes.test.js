import { jest, expect, describe, test } from "@jest/globals";
import config from "../../../server/config.js";
import TestUtil from './_util/testUtil.js';
import { handler } from "../../../server/routes.js";
import { Controller } from '../../../server/controller.js';
import { Service } from '../../../server/service.js';

const {
  pages,
  location,
  constants: {
    CONTENT_TYPE
  }
} = config


describe("#Routes - test site for api response", () => {
  beforeEach(() => {
    jest.restoreAllMocks(),
      jest.clearAllMocks()
  })


  test(`GET / - Should redirect to home page`, async () => {
    const params = TestUtil.defaultHandlerParams();
    params.resquest.method = 'GET';
    params.resquest.url = '/';

    await handler(...params.values())
    expect(params.response.writeHead).toBeCalledWith(
      302, { 'Location': location.home }
    );
    expect(params.response.end).toHaveBeenCalled();
  });


  test(`GET /home - Should response with ${pages.homeHTML} file stream `, async () => {
    const params = TestUtil.defaultHandlerParams();
    params.resquest.method = 'GET';
    params.resquest.url = '/home';

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
    })

    jest.spyOn(
      mockFileStream,
      'pipe'
    ).mockReturnValue();

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.homeHTML);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)

  });


  test(`GET /controller - Should response with ${pages.controllerHTML} page`, async () => {
    const params = TestUtil.defaultHandlerParams();
    params.resquest.method = 'GET';
    params.resquest.url = '/controller';

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
    })

    jest.spyOn(
      mockFileStream,
      'pipe'
    ).mockReturnValue();

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.controllerHTML);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)

  });

  test('GET /index.html - Should response with file stream', async () => {
    const params = TestUtil.defaultHandlerParams();
    const fileName = '/index.html'
    params.resquest.method = 'GET';
    params.resquest.url = fileName;
    const expectedType = '.html';
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    jest.spyOn(
      mockFileStream,
      'pipe'
    ).mockReturnValue();

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(fileName);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      "content-type": CONTENT_TYPE[expectedType]
    }
    )
  })

  test('GET /file.ext - Should response with file stream', async () => {
    const params = TestUtil.defaultHandlerParams();
    const fileName = '/file.ext'
    params.resquest.method = 'GET';
    params.resquest.url = fileName;
    const expectedType = '.ext';
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    jest.spyOn(
      mockFileStream,
      'pipe'
    ).mockReturnValue();

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(fileName);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalled()
  })

  test("GET /stream - Should response with audio stream", async () =>  {
    const params = TestUtil.defaultHandlerParams();

    params.resquest.method = "GET"
    params.resquest.url = "/stream?id=100101";

    const clientStreamMock = TestUtil.generatePassThroughStream();

    const onClose = jest.fn();

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.createClientStream.name
    ).mockReturnValue({
      stream: clientStreamMock,
      onClose
    })

    jest.spyOn(clientStreamMock, 'pipe').mockReturnValue();

    await handler(...params.values());


    expect(Controller.prototype.createClientStream).toHaveBeenCalled();
    expect(clientStreamMock.pipe).toHaveBeenCalledWith(params.response);
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'content-type': 'audio/mpeg',
				'Accept-Rages': 'bytes'
    })
  })

  test("POST / controller - Should call handleCommand", async () => {
    const params = TestUtil.defaultHandlerParams();

    params.resquest.method = "POST";
    params.resquest.url = "/controller";

    const body = {
      command : "start"
    }



    const jsonResult = {
      ok: "1"
    }

    jest.spyOn(
      Controller.prototype,
      Controller.prototype.handleCommand.name
    ).mockResolvedValue(jsonResult)

    params.resquest.push(JSON.stringify(body))

      await handler(...params.values());

      expect(Controller.prototype.handleCommand).toHaveBeenCalledWith(body);
      expect(params.response.end).toHaveBeenCalledWith((JSON.stringify(jsonResult))) //test
  })

  test('GET /unknown - given an inexistent  route it should response with 404', async () => {
    const params = TestUtil.defaultHandlerParams();
    params.resquest.method = 'POST';
    params.resquest.url = 'unknown';

    await handler(...params.values());

    expect(params.response.writeHead).toHaveBeenCalledWith(404);
    expect(params.response.end).toHaveBeenCalled();
  })

  describe('exceptions', () => {
    test('given inexistent file it should respond with 404', async () => {
      const params = TestUtil.defaultHandlerParams();
      params.resquest.method = 'GET';
      params.resquest.url = '/index.png';
      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValue(new Error('Error: ENOENT: no surch file or directory'))
      await handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(404);
      expect(params.response.end).toHaveBeenCalled();
    })

    test('given an error it should respond with 500', async () => {

      const params = TestUtil.defaultHandlerParams();
      params.resquest.method = 'GET';
      params.resquest.url = '/index.png';

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValue(new Error('Error:'))

      await handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(500);
      expect(params.response.end).toHaveBeenCalled();
    })
  })
})