import * as express from 'express';           // express
import { Request, Response } from "express";  // express 
import { logger } from "../logger"            // logger
import { AppDataBase } from '../db';

// db
const db = AppDataBase.getInstance();

// router definition
export const launcherRouter = express.Router();

// GET launchers
launcherRouter.get("/", async(req: Request, res: Response) => {
  try {
    const launchers = await db.loadLaunchers();
    if(!launchers) {
      throw Error("loadLaunchers() error");
    }
    if(launchers.length > 0) {
      res.status(200).send(launchers);
    }
    else {
      res.status(204).send();
    }
  }
  catch(error: any) {
    logger.error(`GET "/" ${JSON.stringify(error)}`);
    res.status(400).send(error.message);
  }
});

// POST launcher
launcherRouter.post("/", async(req: Request, res: Response) => {
    const address = req.body;
    try {
      await db.addLauncher(address.address);
      res.status(200).send();
    }
    catch(error: any) {
      logger.error(`POST "/" ${address} ${JSON.stringify(error)}`);
      res.status(400).send(error.message);
    }
  });

  // DELETE user
  launcherRouter.delete("/:id", async(req: Request, res: Response) => {
    const id = req?.params?.id;
    try {
      await db.deleteLauncher(parseInt(id));
      res.status(200).send();
    }
    catch(error: any) {
      logger.error(`DELETE "/:id" ${JSON.stringify(error)}`);
      res.status(400).send(error.message);
    }
  });