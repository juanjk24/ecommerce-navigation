import { Router } from 'express';
import { getProductsController } from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProductsController);

export default router;