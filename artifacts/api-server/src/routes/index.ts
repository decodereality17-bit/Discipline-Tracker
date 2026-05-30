import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tasksRouter from "./tasks";
import statsRouter from "./stats";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tasksRouter);
router.use(statsRouter);
router.use(activityRouter);

export default router;
