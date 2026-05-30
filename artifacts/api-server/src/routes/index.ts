import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tasksRouter from "./tasks";
import statsRouter from "./stats";
import activityRouter from "./activity";
import profilesRouter from "./profiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tasksRouter);
router.use(statsRouter);
router.use(activityRouter);
router.use(profilesRouter);

export default router;
