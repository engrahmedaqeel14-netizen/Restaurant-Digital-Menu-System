import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import restaurantsRouter from "./restaurants";
import menusRouter from "./menus";
import displayRouter from "./display";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(restaurantsRouter);
router.use(menusRouter);
router.use(displayRouter);

export default router;
