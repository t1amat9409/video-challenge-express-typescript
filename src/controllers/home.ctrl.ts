import express from "express";
import { Request, Response } from "express";
import IControllerBase from "../interfaces/IControllerBase.interface";

class HomeCTRL implements IControllerBase {
  public path = "/";
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get("/", this.index);
  }

  index = (req: Request, res: Response) => {
    return res.status(200).json({
      error: false,
      message: ""
    });
  };
}

export default HomeCTRL;
