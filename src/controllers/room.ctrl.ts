import express from "express";
import { Request, Response } from "express";
import IControllerBase from "../interfaces/IControllerBase.interface";
import { DB, RoomInput } from "../db";
class RoomsCTRL implements IControllerBase {
  public path = "/rooms";
  public router = express.Router();
  private db: DB;

  constructor(db: DB) {
    this.initRoutes();
    this.db = db;
  }

  public initRoutes() {
    this.router.get(`${this.path}`, this.index); //All rooms

    this.router.get(`${this.path}/:guid`, (req: Request, res: Response) => {
      const input: string = req.params.guid;
      const room = this.db.roomInfo(input);
      return res.status(200).json(room);
    }); //specific room using :guid

    this.router.post(`${this.path}/search`, (req: Request, res: Response) => {
      const input: string = req.body.username;
      const room = this.db.search(input);
      return res.status(200).json(room);
    }); //specific room using :guid

    this.router.post(`${this.path}/add`, (req: Request, res: Response) => {
      const input: RoomInput = req.body;
      const room = this.db.addRoom(input);
      return res.status(200).json(room);
    });

    this.router.post(`${this.path}/edit`, (req: Request, res: Response) => {
      const host = req.body.host;
      const nexthost = req.body.nexthost;
      const guid = req.body.guid;
      const room = this.db.changeRoomHost(host, nexthost, guid);
      return res.status(200).json(room);
    });

    this.router.post(
      `${this.path}/joinOrLeave`,
      (req: Request, res: Response) => {
        const username = req.body.username;
        const guid = req.body.guid;
        const data = this.db.joinLeaveRoom(username, guid);
        return res.status(200).json(data);
      }
    );
  }

  index = (req: Request, res: Response) => {
    return res.status(200).json(this.db.getRooms());
  };
}

export default RoomsCTRL;
