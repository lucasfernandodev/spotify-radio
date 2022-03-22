import fs from "fs";
import fsPromises from 'fs/promises'
import config from './config.js';
import path, {join, extname} from "path";
import { randomUUID } from "crypto";
import { PassThrough, Writable } from "stream";
import Throttle from "throttle";
import childProcess from "child_process";
import {logger} from "./util.js"
import streamsPromises from "stream/promises";
import { once } from "events";

const {
  dir : {
    publicDirectory,
    fxDirectory
  },
  constants: {
    fallBackBitrate,
    englishConversation,
    bitRateDivisor,
    audioMediaType,
    songVolume,
    fxVolume
  }
} = config;

export class Service {

  constructor(){
    this.clientStreams = new Map();
    this.currentSong = englishConversation;
    this.currentBitRate = 0;
    this.throttleTransform = {}
    this.currentReadable = {}
  }

  createClientStream(){
    const id = randomUUID();
    const clientStream = new PassThrough();
    this.clientStreams.set(id, clientStream);

    return {
      id,
      clientStream
    }
  }
  
  removeClientStream(id){
    this.clientStreams.delete(id)
  }

  _executeSoxCommand(args){
    return childProcess.spawn('sox', args)
  }

  async getBitRate(song){
    try {
      const args = [
        '--i', // info
        '-B', // bitrate
        song
      ]

      const {
        stderr, // Tudo que é error
        stdout, // tudo que é log
        // stdin, //envia dados como stream
      }= this._executeSoxCommand(args)

      await Promise.all([
        once(stdout, 'readable'),
        once(stderr, 'readable'),
      ])

      const [success,error] = [stdout, stderr].map(stream => stream.read());

      if(error) return await Promise.reject(error);

      return success
      .toString()
      .trim()
      .replace("k",'000');

    } catch (error) {
      logger.error(`Deu ruim no bitrate: ${error}`)
      return fallBackBitrate;
    }
  }

  broadCast(){
    return new Writable({
      write: (chunk, enc, cb) => {
        for(const [id, stream] of this.clientStreams){
          if(stream.writableEnded){
            this.clientStreams.delete(id);
            continue;
          }

          stream.write(chunk);
        }

        cb()
      }
    })
  }

  async startStreaming(){
    logger.info(`starting with ${this.currentSong}`);
    const bitRate = this.currentBitRate = (await this.getBitRate(this.currentSong)) / bitRateDivisor;
    const throttleTransform = this.throttleTransform = new Throttle(bitRate);
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong)


    return streamsPromises.pipeline(
      songReadable,
      throttleTransform,
      this.broadCast()
    )
  }

  stopStreaming(){
    this.throttleTransform?.end?.()
  }

  createFileStream(filename){
    return fs.createReadStream(filename)
  }

  async getFileInfo(file){
    // file = home/index.html
    const fullFilePath = join(publicDirectory, file);
    // Valida se existe, se não existe estoura erro
    await fsPromises.access(fullFilePath);
    const fileType = extname(fullFilePath);

    return {
      type: fileType,
      name: fullFilePath,
    }
  }

  async getFileStream(file){
    const {name, type} = await this.getFileInfo(file);
    
    return {
      stream: this.createFileStream(name),
      type: type
    }
  }

  async readFxByName(fxName){
    const songs = await fsPromises.readdir(fxDirectory);
    const chosenSong = songs.find(filename => filename.toLowerCase().includes(fxName));

    if(!chosenSong) return Promise.reject(`the ${fxName} was not found!`);

    return path.join(fxDirectory, chosenSong);
  }

  appendFxStream(fx){
    const throttleTransform = new Throttle(this.currentBitRate);
    streamsPromises.pipeline(
      throttleTransform,
      this.broadCast()
    )

    const unpipe = () => {
      const transformStream = this.mergeAudioStreams(fx, this.currentReadable)

      this.throttleTransform = throttleTransform;
      this.currentReadable = transformStream
      this.currentReadable.removeListener('unpipe', unpipe);

      streamsPromises.pipeline(
        transformStream,
        throttleTransform
      )
    }

    this.throttleTransform.on('unpipe', unpipe)
    this.throttleTransform.pause();
    this.currentReadable.unpipe(this.throttleTransform);

  }

  mergeAudioStreams(song, readable){
    const transformStream = PassThrough();

    const args = [
      '-t', audioMediaType,
      '-v', songVolume,
      // -m => merge; o - é para receber como streaming
      '-m', '-',
      '-t', audioMediaType,
      '-v', fxVolume,
      song,
      '-t',audioMediaType,
      '-'
    ]

    const {
      stdout,
      stdin,
    } = this._executeSoxCommand(args);

    // Plugamos a stream de conversão na entrada de dados do terminal
    streamsPromises.pipeline(
      readable,
      stdin,
    )

    streamsPromises.pipeline(
      stdout,
      transformStream
    )

    return transformStream;
  }
}