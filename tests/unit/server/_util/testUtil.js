/* istanbul ignore file */
import { jest } from "@jest/globals";
import {PassThrough, Readable, Writable} from "stream";


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

  static generatePassThroughStream(){
    return new PassThrough;
  }

  static generateWritableStream(ondata){
    return new Writable({
      write(chunk, enc, cb){
        ondata(chunk)
        cb(null, chunk)
      }
    });
  }

  static defaultHandlerParams(requestData = 'data'){
    const requestStream = TestUtil.generateReadableStream([requestData])
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