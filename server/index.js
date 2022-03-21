import config from './config.js';
import Server from "./server.js";
import {logger} from './util.js';

const server = Server()
server.listen(config.port)
.on("listening", () => logger.info(`server running at ${config.port}!!`));

// Impede que a aplicação não quebre caso um erro não tratado aconteça
process.on('uncaughtException', (error) => logger.error(`unhandledRejection happened: ${error.stack || error}`));
process.on('unhandledRejection', (error) => logger.error(`unhandledRejection happened: ${error.stack || error}`))