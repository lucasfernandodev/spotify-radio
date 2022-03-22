import {beforeEach, describe, jest,test, expect} from '@jest/globals';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import {Service} from '../../../server/service.js';
import TestUtil from './_util/testUtil.js';
import config from "../../../server/config.js";
import streamsAsync from 'stream/promises'
import childProcess from 'child_process';
import stream from 'stream';
import Throttle from 'throttle';

const {
  PassThrough,
  Writable,
} = stream

const {
  dir: {
    publicDirectory
  },
  constants: {
    fallBackBitrate,
    bitRateDivisor
  }
} = config;

describe('#service - test suite for API service', () => {

  const getSpawnResponse = ({
    stdout = '',
    stderr = '',
    stdin = () => {}
  }) => ({
    stdout: TestUtil.generateReadableStream([stdout]),
    stderr: TestUtil.generateReadableStream([stderr]),
    stdin: TestUtil.generateWritableStream(stdin),
  })

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

  test('removeClientStream', async () => {
    const service = new Service ();

    jest.spyOn(
      service.clientStreams,
      service.clientStreams.delete.name
    ).mockReturnValue()
    const mockId = '1';
    
    service.removeClientStream(mockId);

    expect(service.clientStreams.delete).toHaveBeenCalledWith(mockId);
  })

  test('createClientStream', async () => {
    const service = new Service ();

    jest.spyOn(
      service.clientStreams,
      service.clientStreams.set.name
    ).mockReturnValue()

    const {
      id,
      clientStream
    } = service.createClientStream();

    expect(id.length).toBeGreaterThan(0);
    expect(clientStream).toBeInstanceOf(PassThrough);
    expect(service.clientStreams.set).toHaveBeenCalledWith(id, clientStream);
  })

  test('stopStreamming - existing throttleTransform', async () => {
    const service = new Service();
    service.throttleTransform = new Throttle(1);

    jest.spyOn(
      service.throttleTransform,
      "end",
    ).mockReturnValue();

    service.stopStreaming();
    expect(service.throttleTransform.end).toHaveBeenCalled(); 

  })

  test('stopStreaming - non exiting throttleTransform', async () => {
    const service = new Service();
    expect(() => service.stopStreaming()).not.toThrow();
  })

  test('broadcast - It should write only for active client streams', async () => {
    const service = new Service();
    const onData = jest.fn();
  
    const client1 = TestUtil.generateWritableStream(onData);
    const client2 = TestUtil.generateWritableStream(onData);

    jest.spyOn(
      service.clientStreams,
      service.clientStreams.delete.name
    )

    service.clientStreams.set('1', client1);
    service.clientStreams.set('2', client2);

    client2.end();

    const writable = service.broadCast();

    writable.write('Hello world');

    expect(writable).toBeInstanceOf(Writable);
    expect(service.clientStreams.delete).toHaveBeenCalled();
    expect(onData).toHaveBeenCalledTimes(1)
  })
  
  test('getBitRate - It should return the bitRate as string', async () => {
    const song = 'mySong';
    const service = new Service();

    const spawnResponse = getSpawnResponse({
      stdout: '1k'
    })

    jest.spyOn(
      service,
      service._executeSoxCommand.name
    ).mockReturnValue(spawnResponse);

    const bitRatePromise = service.getBitRate(song);
    
    const result = await bitRatePromise;
    expect(result).toStrictEqual('1000');
    expect(service._executeSoxCommand).toHaveBeenCalledWith(['--i','-B', song])
  }) //test

  test('getBitRate - when an error ocurred it should get the fallbackBitRate', async () => {
    const song = 'mySong';
    const service = new Service();

    const spawnResponse = getSpawnResponse({
      stderr: 'error!'
    })

    jest.spyOn(
      service,
      service._executeSoxCommand.name
    ).mockReturnValue(spawnResponse);

    const bitRatePromise = service.getBitRate(song);
    
    const result = await bitRatePromise;
    expect(result).toStrictEqual(fallBackBitrate);
    expect(service._executeSoxCommand).toHaveBeenCalledWith(['--i','-B', song])
  }) //test

  test('_executeSoxCommand - It should call the sox command', async () => {
    const service = new Service();
    const spawnResponse = getSpawnResponse({
      stdout: '1k'
    });

    jest.spyOn(
      childProcess,
      childProcess.spawn.name
    ).mockReturnValue(spawnResponse)

    const args = ['myArgs'];
    const result = service._executeSoxCommand(args);

    expect(childProcess.spawn).toHaveBeenCalledWith('sox', args)
    expect(result).toStrictEqual(spawnResponse); //test
  })

  test('#startStream - It should call the sox command', async () => {
    const currentSong = 'mySong.mp3';
    const service = new Service();

    service.currentSong = currentSong;

    const currentReadable = TestUtil.generateReadableStream(['test']);
    const expectedResult = "ok";
    const writableBroadCaster = TestUtil.generateWritableStream(() => {});

    jest.spyOn(
      service,
      service.getBitRate.name
    ).mockResolvedValue(fallBackBitrate);

    jest.spyOn(
      streamsAsync,
      streamsAsync.pipeline.name
    ).mockResolvedValue(expectedResult);

    jest.spyOn(
      fs,
      fs.createReadStream.name
    ).mockReturnValue(currentReadable)

    jest.spyOn(
      service,
      service.broadCast.name
    ).mockReturnValue(writableBroadCaster)


    const expectedThrottle = fallBackBitrate / bitRateDivisor
    const result = await service.startStreaming()

    expect(service.currentBitRate).toEqual(expectedThrottle);
    expect(result).toEqual(expectedResult);

    expect(service.getBitRate).toHaveBeenCalledWith(currentSong);
    expect(fs.createReadStream).toHaveBeenCalledWith(currentSong);
    expect(streamsAsync.pipeline).toHaveBeenCalledWith(
      currentReadable,
      service.throttleTransform,
      service.broadCast() // test
    )

  })

})