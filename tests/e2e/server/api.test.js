import { jest, expect, describe, test } from "@jest/globals";
import config from "../../../server/config.js";
import superTest from "supertest";
import portfinder from 'portfinder';
import Server from '../../../server/server.js';
import {Transform} from 'stream'
import {setTimeout} from 'timers/promises';
import fs from 'fs';

const RETENTION_DATA_PERIOD = 200;
const getAvailablePort = portfinder.getPortPromise

const commandResponseExpected = JSON.stringify({
  result: "ok"
})

const possibleCommands = {
  start : 'start',
  stop: 'stop'
}

function pipeAndReadStreamData(stream, onChunk){

  const transform = new Transform({
    transform(chunk, enc, cb){
      onChunk(chunk)
      cb(null, chunk)
    }
  })

  return stream.pipe(transform);
}

async function getTestServer() {
  const getSuperTest = port => superTest(`http://localhost:${port}`); 
  const port = await getAvailablePort();

  return new Promise((resolve, reject) => {
    const server = Server().listen(port)
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

describe("API E2E Suite Test", () =>{


  let testServer = superTest(Server());

  test("GET /unknown - Given an unknown route it should respond with 404 status code", async () => {
    const response = await testServer.get("/unknown");

    expect(response.statusCode).toStrictEqual(404);
  });


  test("GET / - It should respond with the home location and 302 status code", async () => {
    const response = await testServer.get("/");

    expect(response.header.location).toStrictEqual("/home");
    expect(response.statusCode).toStrictEqual(302);

  })


  test("GET /home - It should respond with file stream", async () => {
    const response = await testServer.get('/home');
    const homePage = await fs.promises.readFile(`${config.dir.publicDirectory}/${config.pages.homeHTML}`);
    expect(response.text).toStrictEqual(homePage.toString());
  })

  test("GET /controller - It should respond with file stream", async () => {
    const response = await testServer.get('/controller');
    const controllerPage = await fs.promises.readFile(`${config.dir.publicDirectory}/${config.pages.controllerHTML}`)
  
    expect(response.text).toStrictEqual(controllerPage.toString());
  })

  describe("Client WorkFlow", () => {


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

      const [
        [buffer]
      ] = onChunk.mock.calls;


      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000)

            server.kill();
    });

    
  })

  describe("GET static files", () => {

    test("GET /file.js - It should respond 404 if file does not exist", async () => {
      const file = "/file.js";
      const response = await testServer.get(file);
      
      expect(response.statusCode).toStrictEqual(404)
    })

    test("GET /controller/css/index.css - Given a css file it should respond with content-type text/css" , async () => {
      const file = "/controller/css/index.css";
      const response = await testServer.get(file);
      const expectExistingPage = await fs.promises.readFile(`${config.dir.publicDirectory}${file}`);

      expect(response.text).toStrictEqual(expectExistingPage.toString());
      expect(response.statusCode).toStrictEqual(200);
      expect(response.header["content-type"]).toStrictEqual("text/css");
    })

    test("GET /home/js/animation.js - Given a js file it should respond with content-type text/javascript", async () => {
      const file = '/home/js/animation.js';
      const response = await testServer.get(file);
      const expectExistingPage = await fs.promises.readFile(`${config.dir.publicDirectory}${file}`);

      expect(response.text).toStrictEqual(expectExistingPage.toString());
      expect(response.statusCode).toStrictEqual(200);
      expect(response.header["content-type"]).toStrictEqual("text/javascript");
    })

    test("GET /controller/index.html - Given a html file it should respond with content-type text/html", async () => {
      const file = "/controller/index.html";
      const response = await testServer.get(file);
      const expectExistingPage = await fs.promises.readFile(`${config.dir.publicDirectory}${file}`);

      expect(response.text).toStrictEqual(expectExistingPage.toString());
      expect(response.statusCode).toStrictEqual(200);
      expect(response.header["content-type"]).toStrictEqual("text/html");
    })
  })
})