import { jest, expect, describe, test } from "@jest/globals";
import config from "../../../server/config.js";
import superTest from "supertest";
import portfinder from 'portfinder';
import Server from '../../../server/server.js';
import {Transform} from 'stream'
import {setTimeout} from 'timers/promises';

const RETENTION_DATA_PERIOD = 200;
const getAvailablePort = portfinder.getPortPromise


describe("API E2E Suite Test", () =>{



  function pipeAndReadStreamData(stream, onChunk){

    const transform = new Transform({
      transform(chunk, enc, cb){
        onChunk(chunk)
        cb(null, chunk)
      }
    })

    return stream.pipe(transform);
  }


  describe("Client WorkFlow", () => {

    const commandResponseExpected = JSON.stringify({
      result: "ok"
    })
  
    const possibleCommands = {
      start : 'start',
      stop: 'stop'
    }

    async function getTestServer() {
      const getSuperTest = port => superTest(`http://localhost:${port}`); 
      const port = await getAvailablePort();

      return new Promise((resolve, reject) => {
        const server = Server.listen(port)
        .once(`listening`, () => {

          const testServer = getSuperTest(port)
          const response = {
            testServer,
            kill(){
              server.close()
            }
          }

          return resolve(response)
        })
        .once('error', reject)
      })
    }


  function commandSender(testServer){

    return {
      async send(command){
        const response = await testServer.post('/controller').send({
          command
        })

        expect(response.text).toStrictEqual(commandResponseExpected)
      }
    }
  }

    test("It should not receive data stream in the process is not playing", async () => {
      const server = await getTestServer();
      const onChunk = jest.fn();
      pipeAndReadStreamData(
        server.testServer.get("/stream"),
        onChunk
      )
      

      await setTimeout(RETENTION_DATA_PERIOD)
      server.kill();
      expect(onChunk).not.toHaveBeenCalled();
    });

    test("It should receive data stream if the process is play", async () => {
      const server = await getTestServer();
      const onChunk = jest.fn();
      const {send} = commandSender(server.testServer);

      pipeAndReadStreamData(
        server.testServer.get("/stream"),
        onChunk
      )

      await send(possibleCommands.start)
      await setTimeout(RETENTION_DATA_PERIOD)
      await send(possibleCommands.stop)

      console.log("calls", onChunk.mock.calls)
      const [
        [buffer]
      ] = onChunk.mock.calls;

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000)
      server.kill();
    });

  })
})