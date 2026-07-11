
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getRegions, getProvincesByRegion, getLocationsByParent, getLocationByCode } from '../controllers/public_location.controller';

const router = Router();

// Public/Auth routes for dropdowns
router.use(authenticate as RequestHandler);

router.get('/regions', getRegions as RequestHandler);
router.get('/provinces/:regionId', getProvincesByRegion as RequestHandler);
router.get('/children', getLocationsByParent as RequestHandler); // Query: ?parentCode=...&type=...
router.get('/code', getLocationByCode as RequestHandler); // Query: ?code=...

export default router;
