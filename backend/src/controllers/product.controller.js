import { getProducts } from '../services/product.service.js';

export async function getProductsController(req, res) {
    try {
        const products = await getProducts();

        res.json(products);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error obteniendo productos'
        });
    }
}