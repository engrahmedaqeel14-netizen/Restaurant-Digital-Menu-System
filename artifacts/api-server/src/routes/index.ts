import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import restaurantsRouter from "./restaurants";
import menusRouter from "./menus";
import displayRouter from "./display";
import storageRouter from "./storage";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(restaurantsRouter);
router.use(menusRouter);
router.use(displayRouter);
router.use(storageRouter);
router.use(adminRouter);

export default router;
