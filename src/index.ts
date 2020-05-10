import App from "./app";
import logger from "./logger";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as helmet from "helmet";
import HomeCTRL from "./controllers/home.ctrl";
import UserCTRL from "./controllers/user.ctrl";
import RoomsCTRL from "./controllers/room.ctrl";
import db from "./db";

const app = new App({
  port: 3000,
  controllers: [new HomeCTRL(), new UserCTRL(db), new RoomsCTRL(db)],
  middleWares: [
    cors,
    helmet,
    //compression,
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    logger
  ]
});

app.listen();
