import fs from "fs";
import fsPromises from 'fs/promises'
import config from './config.js';
import {join, extname} from "path";
import { randomUUID } from "crypto";
import { PassThrough } from "stream";
const {
  dir : {
    publicDirectory
  }
} = config;

export class Service {

  constructor(){
    this.clientStream = new Map();
  }

  createClientStream(){
    const id = randomUUID();
    const clientStream = new PassThrough();
    this.clientStream.set(id, clientStream);

    return {
      id,
      clientStream
    }
  }
  
  removeClientStream(id){
    this.clientStream.delete(id)
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
}