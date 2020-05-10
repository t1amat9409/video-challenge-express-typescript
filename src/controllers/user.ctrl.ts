import express from "express";
import { Request, Response } from "express";
import IControllerBase from "../interfaces/IControllerBase.interface";
import { DB, UserInput, UserUpdateInput } from "../db";
class UserCTRL implements IControllerBase {
  public path = "/users";
  public router = express.Router();
  private db: DB;

  constructor(db: DB) {
    this.initRoutes();
    this.db = db;
  }

  public initRoutes() {
    this.router.get(`${this.path}`, this.index); //All users

    this.router.get(`${this.path}/:username`, (req: Request, res: Response) => {
      const input: string = req.params.username;
      const user = this.db.getUser(input);
      return res.status(200).json(user);
    }); //specific user using :username

    this.router.post(`${this.path}/add`, (req: Request, res: Response) => {
      const input: UserInput = req.body;
      const user = this.db.addUser(input);
      return res.status(200).json(user);
    });

    this.router.post(`${this.path}/auth`, (req: Request, res: Response) => {
      const { username, password } = req.body;
      const user = this.db.auth(username, password);
      return res.status(200).json(user);
    });

    this.router.post(`${this.path}/edit`, (req: Request, res: Response) => {
      const username = req.body.username;
      const data: UserUpdateInput = req.body.data;
      const user = this.db.updateUser(username, data);
      return res.status(200).json(user);
    });

    this.router.post(`${this.path}/delete`, (req: Request, res: Response) => {
      const username = req.body.username;
      const data = this.db.deleteUser(username);
      return res.status(200).json(data);
    });
  }

  index = (req: Request, res: Response) => {
    return res.status(200).json(this.db.getUsers());
  };
}

export default UserCTRL;
