import {beforeEach, describe, jest,test, expect} from '@jest/globals';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import {Service} from '../../../server/service.js';
import TestUtil from './_util/testUtil.js';
import config from "../../../server/config.js";

const {
  dir: {
    publicDirectory
  }
} = config;

describe('#service - test suite for API service', () => {

  beforeEach(() => {
    jest.restoreAllMocks(),
    jest.clearAllMocks()
  })

  test('createFileStream - Deve gerar um readStream', async () => {

    const mockFileStream = TestUtil.generateReadableStream(['data']);
    const filename = '/index.html';

    const createReadbleStream = jest.spyOn(fs, fs.createReadStream.name)
    .mockReturnValue(mockFileStream);

    const service = new Service;
    const serviceReturn = service.createFileStream(filename)

    expect(createReadbleStream).toBeCalledWith(filename)
    expect(serviceReturn).toStrictEqual(mockFileStream)

  });

  test('getFileInfo - Should return file info', async () => {
    const file = '/index.html';
    const expectedType = '.html';
    const expectedFullFilePath = publicDirectory + file;

    jest.spyOn(path, path.join.name).mockResolvedValue(expectedFullFilePath);

    jest.spyOn(fsPromises, fsPromises.access.name).mockResolvedValue(null);

    jest.spyOn(path, path.extname.name).mockResolvedValue('.html');

    const service = new Service();
    const serviceReturn = await service.getFileInfo(file);

    expect(serviceReturn).toStrictEqual({
      type: expectedType,
      name: expectedFullFilePath
    })
  });

  test('getFileStream - Should create a file stream and return it with the file type' , async () => {
    const file = "/index.html";
    const expectedType = '.html';
    const expectedFullFilePath = publicDirectory + file;
    const mockFileStream = TestUtil.generateReadableStream(['data']);

    jest.spyOn(fs, fs.createReadStream.name).mockResolvedValue(mockFileStream);
    jest.spyOn(path, path.join.name).mockResolvedValue(expectedFullFilePath);
    jest.spyOn(fsPromises, fsPromises.access.name).mockResolvedValue(null);
    jest.spyOn(path, path.extname.name).mockResolvedValue('.html');

    const service = new Service;
    const serviceReturn = await service.getFileStream(file);

    expect(serviceReturn.stream).resolves.toStrictEqual(mockFileStream);
    expect(serviceReturn.type).toStrictEqual(expectedType);
  });

})