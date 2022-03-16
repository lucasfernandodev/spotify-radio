/* istanbul ignore file */
import { jest } from "@jest/globals";
import {Readable, Writable} from "stream";


export default class TestUtil{

  static generateReadableStream(data){
    return new Readable({
      read(){
        for(const item of data){
          this.push(item)
        }

        this.push(null)
      }
    });
  }

  static generateWritableStream(ondata){
    return new Writable({
      write(chunk, enc, cb){
        ondata(chunk)
        cb(null, chunk)
      }
    });
  }

  static defaultHandlerParams(){
    const requestStream = TestUtil.generateReadableStream(['body da requisição'])
    const response = TestUtil.generateWritableStream(() => {});
    const data = {
      resquest: Object.assign(requestStream,{
        headers: {},
        method: {},
        url: {},
      }),
      response: Object.assign(response, {
        writeHead: jest.fn(),
        end: jest.fn(),
      })
    }

    return {
      values: () => Object.values(data),
      ...data
    }
  } 
}