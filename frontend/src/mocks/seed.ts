import { faker } from '@faker-js/faker/locale/fr';
import {
  type CampaignDTO,
  type EstablishmentDTO,
  type GroupDTO,
  type HousingDTO,
  HousingStatus,
  Occupancy,
  type OwnerDTO,
  type UserDTO,
  UserRole
} from '@zerologementvacant/models';
import {
  genCampaignDTONext,
  genEstablishmentDTO,
  genGroupDTO,
  genHousingDTO,
  genNoteDTO,
  genOwnerDTO,
  genUserDTO
} from '@zerologementvacant/models/fixtures';

import data from './handlers/data';

/**
 * Email of the demo "current user". The login screen accepts this email (any
 * password); it is also the account auto-logged-in at boot.
 */
export const DEMO_EMAIL = 'demo@zerologementvacant.beta.gouv.fr';

/**
 * Number of housings to generate, spread across every commune of the EPCI
 * (weighted by population, so Bayonne concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de la CA du Pays Basque (SIREN 200067106) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const EPCI_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '64102', postalCode: '64100', city: 'Bayonne', center: { latitude: 43.4844, longitude: -1.4611 }, population: 54306 },
  { geoCode: '64024', postalCode: '64600', city: 'Anglet', center: { latitude: 43.4893, longitude: -1.5193 }, population: 43271 },
  { geoCode: '64122', postalCode: '64200', city: 'Biarritz', center: { latitude: 43.4709, longitude: -1.5557 }, population: 26206 },
  { geoCode: '64260', postalCode: '64700', city: 'Hendaye', center: { latitude: 43.3635, longitude: -1.7627 }, population: 18102 },
  { geoCode: '64483', postalCode: '64500', city: 'Saint-Jean-de-Luz', center: { latitude: 43.3934, longitude: -1.6337 }, population: 14857 },
  { geoCode: '64545', postalCode: '64122', city: 'Urrugne', center: { latitude: 43.3507, longitude: -1.7018 }, population: 10661 },
  { geoCode: '64140', postalCode: '64340', city: 'Boucau', center: { latitude: 43.5259, longitude: -1.4814 }, population: 8968 },
  { geoCode: '64547', postalCode: '64480', city: 'Ustaritz', center: { latitude: 43.4019, longitude: -1.4704 }, population: 7897 },
  { geoCode: '64125', postalCode: '64210', city: 'Bidart', center: { latitude: 43.4385, longitude: -1.5754 }, population: 7689 },
  { geoCode: '64256', postalCode: '64240', city: 'Hasparren', center: { latitude: 43.3951, longitude: -1.3196 }, population: 7626 },
  { geoCode: '64495', postalCode: '64310', city: 'Saint-Pée-sur-Nivelle', center: { latitude: 43.3469, longitude: -1.5605 }, population: 7264 },
  { geoCode: '64160', postalCode: '64250', city: 'Cambo-les-Bains', center: { latitude: 43.3622, longitude: -1.3886 }, population: 6760 },
  { geoCode: '64189', postalCode: '64500', city: 'Ciboure', center: { latitude: 43.3764, longitude: -1.6661 }, population: 5951 },
  { geoCode: '64496', postalCode: '64990', city: 'Saint-Pierre-d’Irube', center: { latitude: 43.4628, longitude: -1.4447 }, population: 5900 },
  { geoCode: '64407', postalCode: '64990', city: 'Mouguerre', center: { latitude: 43.4588, longitude: -1.4057 }, population: 5428 },
  { geoCode: '64065', postalCode: '64310', city: 'Ascain', center: { latitude: 43.3383, longitude: -1.6283 }, population: 4658 },
  { geoCode: '64038', postalCode: '64200', city: 'Arcangues', center: { latitude: 43.4261, longitude: -1.5079 }, population: 3657 },
  { geoCode: '64100', postalCode: '64200', city: 'Bassussarry', center: { latitude: 43.4445, longitude: -1.4974 }, population: 3414 },
  { geoCode: '64558', postalCode: '64990', city: 'Villefranque', center: { latitude: 43.4452, longitude: -1.4462 }, population: 3069 },
  { geoCode: '64540', postalCode: '64990', city: 'Urcuit', center: { latitude: 43.4830, longitude: -1.3487 }, population: 3047 },
  { geoCode: '64371', postalCode: '64130', city: 'Mauléon-Licharre', center: { latitude: 43.2140, longitude: -0.8842 }, population: 2972 },
  { geoCode: '64147', postalCode: '64240', city: 'Briscous', center: { latitude: 43.4600, longitude: -1.3274 }, population: 2965 },
  { geoCode: '64504', postalCode: '64310', city: 'Sare', center: { latitude: 43.2968, longitude: -1.5822 }, population: 2763 },
  { geoCode: '64304', postalCode: '64990', city: 'Lahonce', center: { latitude: 43.4816, longitude: -1.4020 }, population: 2740 },
  { geoCode: '64035', postalCode: '64210', city: 'Arbonne', center: { latitude: 43.4201, longitude: -1.5536 }, population: 2447 },
  { geoCode: '64546', postalCode: '64240', city: 'Urt', center: { latitude: 43.4759, longitude: -1.2923 }, population: 2346 },
  { geoCode: '64279', postalCode: '64250', city: 'Itxassou', center: { latitude: 43.3096, longitude: -1.4046 }, population: 2248 },
  { geoCode: '64493', postalCode: '64120', city: 'Saint-Palais', center: { latitude: 43.3173, longitude: -1.0410 }, population: 2204 },
  { geoCode: '64317', postalCode: '64480', city: 'Larressore', center: { latitude: 43.3688, longitude: -1.4446 }, population: 2163 },
  { geoCode: '64213', postalCode: '64250', city: 'Espelette', center: { latitude: 43.3226, longitude: -1.4521 }, population: 2155 },
  { geoCode: '64009', postalCode: '64210', city: 'Ahetze', center: { latitude: 43.4059, longitude: -1.5658 }, population: 2104 },
  { geoCode: '64094', postalCode: '64520', city: 'Bardos', center: { latitude: 43.4738, longitude: -1.2200 }, population: 1905 },
  { geoCode: '64477', postalCode: '64430', city: 'Saint-Étienne-de-Baïgorry', center: { latitude: 43.1792, longitude: -1.3543 }, population: 1527 },
  { geoCode: '64485', postalCode: '64220', city: 'Saint-Jean-Pied-de-Port', center: { latitude: 43.1570, longitude: -1.2338 }, population: 1479 },
  { geoCode: '64527', postalCode: '64250', city: 'Souraïde', center: { latitude: 43.3431, longitude: -1.4892 }, population: 1472 },
  { geoCode: '64123', postalCode: '64520', city: 'Bidache', center: { latitude: 43.4676, longitude: -1.1359 }, population: 1338 },
  { geoCode: '64249', postalCode: '64210', city: 'Guéthary', center: { latitude: 43.4210, longitude: -1.6104 }, population: 1306 },
  { geoCode: '64130', postalCode: '64700', city: 'Biriatou', center: { latitude: 43.3227, longitude: -1.7322 }, population: 1297 },
  { geoCode: '64282', postalCode: '64480', city: 'Jatxou', center: { latitude: 43.4059, longitude: -1.4109 }, population: 1267 },
  { geoCode: '64086', postalCode: '64240', city: 'Ayherre', center: { latitude: 43.3716, longitude: -1.2369 }, population: 1128 },
  { geoCode: '64250', postalCode: '64520', city: 'Guiche', center: { latitude: 43.5126, longitude: -1.2119 }, population: 1075 },
  { geoCode: '64188', postalCode: '64130', city: 'Chéraute', center: { latitude: 43.2303, longitude: -0.8253 }, population: 1043 },
  { geoCode: '64161', postalCode: '64520', city: 'Came', center: { latitude: 43.4822, longitude: -1.0943 }, population: 1024 },
  { geoCode: '64289', postalCode: '64240', city: 'La Bastide-Clairence', center: { latitude: 43.4180, longitude: -1.2340 }, population: 1000 },
  { geoCode: '64484', postalCode: '64220', city: 'Saint-Jean-le-Vieux', center: { latitude: 43.1733, longitude: -1.2071 }, population: 900 },
  { geoCode: '64350', postalCode: '64250', city: 'Louhossoa', center: { latitude: 43.3172, longitude: -1.3466 }, population: 886 },
  { geoCode: '64436', postalCode: '64780', city: 'Ossès', center: { latitude: 43.2462, longitude: -1.2735 }, population: 878 },
  { geoCode: '64273', postalCode: '64780', city: 'Irissarry', center: { latitude: 43.2559, longitude: -1.2447 }, population: 870 },
  { geoCode: '64377', postalCode: '64240', city: 'Mendionde', center: { latitude: 43.3315, longitude: -1.2930 }, population: 854 },
  { geoCode: '64538', postalCode: '64220', city: 'Uhart-Cize', center: { latitude: 43.1289, longitude: -1.2537 }, population: 816 },
  { geoCode: '64259', postalCode: '64640', city: 'Hélette', center: { latitude: 43.3095, longitude: -1.2472 }, population: 758 },
  { geoCode: '64559', postalCode: '64130', city: 'Viodos-Abense-de-Bas', center: { latitude: 43.2476, longitude: -0.8943 }, population: 747 },
  { geoCode: '64502', postalCode: '64520', city: 'Sames', center: { latitude: 43.5272, longitude: -1.1668 }, population: 709 },
  { geoCode: '64010', postalCode: '64120', city: 'Aïcirits-Camou-Suhast', center: { latitude: 43.3545, longitude: -1.0141 }, population: 699 },
  { geoCode: '64124', postalCode: '64780', city: 'Bidarray', center: { latitude: 43.2682, longitude: -1.3530 }, population: 693 },
  { geoCode: '64014', postalCode: '64250', city: 'Ainhoa', center: { latitude: 43.2968, longitude: -1.4828 }, population: 672 },
  { geoCode: '64275', postalCode: '64220', city: 'Ispoure', center: { latitude: 43.1850, longitude: -1.2385 }, population: 667 },
  { geoCode: '64093', postalCode: '64130', city: 'Barcus', center: { latitude: 43.1835, longitude: -0.7976 }, population: 654 },
  { geoCode: '64364', postalCode: '64240', city: 'Macaye', center: { latitude: 43.3187, longitude: -1.3270 }, population: 593 },
  { geoCode: '64255', postalCode: '64480', city: 'Halsou', center: { latitude: 43.3842, longitude: -1.4089 }, population: 589 },
  { geoCode: '64533', postalCode: '64470', city: 'Tardets-Sorholus', center: { latitude: 43.1243, longitude: -0.8384 }, population: 589 },
  { geoCode: '64120', postalCode: '64120', city: 'Beyrie-sur-Joyeuse', center: { latitude: 43.3059, longitude: -1.0921 }, population: 561 },
  { geoCode: '64271', postalCode: '64640', city: 'Iholdy', center: { latitude: 43.2743, longitude: -1.1757 }, population: 550 },
  { geoCode: '64424', postalCode: '64130', city: 'Ordiarp', center: { latitude: 43.1932, longitude: -0.9595 }, population: 547 },
  { geoCode: '64490', postalCode: '64780', city: 'Saint-Martin-d’Arrossa', center: { latitude: 43.2312, longitude: -1.3148 }, population: 543 },
  { geoCode: '64277', postalCode: '64240', city: 'Isturits', center: { latitude: 43.3698, longitude: -1.2021 }, population: 537 },
  { geoCode: '64425', postalCode: '64120', city: 'Orègue', center: { latitude: 43.4033, longitude: -1.1692 }, population: 531 },
  { geoCode: '64214', postalCode: '64130', city: 'Espès-Undurein', center: { latitude: 43.2746, longitude: -0.8927 }, population: 506 },
  { geoCode: '64106', postalCode: '64120', city: 'Béhasque-Lapiste', center: { latitude: 43.3188, longitude: -1.0085 }, population: 505 },
  { geoCode: '64247', postalCode: '64130', city: 'Gotein-Libarrenx', center: { latitude: 43.1906, longitude: -0.8848 }, population: 479 },
  { geoCode: '64202', postalCode: '64120', city: 'Domezain-Berraute', center: { latitude: 43.3251, longitude: -0.9656 }, population: 473 },
  { geoCode: '64018', postalCode: '64120', city: 'Amendeuix-Oneix', center: { latitude: 43.3439, longitude: -1.0445 }, population: 472 },
  { geoCode: '64231', postalCode: '64130', city: 'Garindein', center: { latitude: 43.2211, longitude: -0.9253 }, population: 457 },
  { geoCode: '64314', postalCode: '64120', city: 'Larceveau-Arros-Cibits', center: { latitude: 43.2245, longitude: -1.0995 }, population: 449 },
  { geoCode: '64476', postalCode: '64640', city: 'Saint-Esteben', center: { latitude: 43.3249, longitude: -1.2191 }, population: 442 },
  { geoCode: '64051', postalCode: '64120', city: 'Arraute-Charritte', center: { latitude: 43.4155, longitude: -1.1168 }, population: 440 },
  { geoCode: '64046', postalCode: '64640', city: 'Armendarits', center: { latitude: 43.2963, longitude: -1.1651 }, population: 398 },
  { geoCode: '64026', postalCode: '64220', city: 'Anhaux', center: { latitude: 43.1442, longitude: -1.3021 }, population: 389 },
  { geoCode: '64362', postalCode: '64120', city: 'Luxe-Sumberraute', center: { latitude: 43.3513, longitude: -1.0779 }, population: 385 },
  { geoCode: '64134', postalCode: '64240', city: 'Bonloc', center: { latitude: 43.3680, longitude: -1.2676 }, population: 376 },
  { geoCode: '64274', postalCode: '64220', city: 'Irouléguy', center: { latitude: 43.1813, longitude: -1.2882 }, population: 364 },
  { geoCode: '64092', postalCode: '64430', city: 'Banca', center: { latitude: 43.0919, longitude: -1.3794 }, population: 358 },
  { geoCode: '64489', postalCode: '64640', city: 'Saint-Martin-d’Arberoue', center: { latitude: 43.3431, longitude: -1.1839 }, population: 350 },
  { geoCode: '64066', postalCode: '64220', city: 'Ascarat', center: { latitude: 43.1826, longitude: -1.2621 }, population: 348 },
  { geoCode: '64322', postalCode: '64220', city: 'Lasse', center: { latitude: 43.1377, longitude: -1.2932 }, population: 334 },
  { geoCode: '64016', postalCode: '64430', city: 'Aldudes', center: { latitude: 43.0924, longitude: -1.4331 }, population: 332 },
  { geoCode: '64034', postalCode: '64120', city: 'Arbérats-Sillègue', center: { latitude: 43.3400, longitude: -0.9912 }, population: 329 },
  { geoCode: '64235', postalCode: '64120', city: 'Garris', center: { latitude: 43.3410, longitude: -1.0585 }, population: 320 },
  { geoCode: '64404', postalCode: '64470', city: 'Montory', center: { latitude: 43.0947, longitude: -0.8110 }, population: 318 },
  { geoCode: '64036', postalCode: '64120', city: 'Arbouet-Sussaute', center: { latitude: 43.3783, longitude: -0.9874 }, population: 313 },
  { geoCode: '64218', postalCode: '64220', city: 'Estérençuby', center: { latitude: 43.0772, longitude: -1.1763 }, population: 303 },
  { geoCode: '64313', postalCode: '64640', city: 'Lantabat', center: { latitude: 43.2634, longitude: -1.1321 }, population: 297 },
  { geoCode: '64017', postalCode: '64470', city: 'Alos-Sibas-Abense', center: { latitude: 43.1149, longitude: -0.8772 }, population: 291 },
  { geoCode: '64492', postalCode: '64220', city: 'Saint-Michel', center: { latitude: 43.0951, longitude: -1.2381 }, population: 290 },
  { geoCode: '64391', postalCode: '64130', city: 'Moncayolle-Larrory-Mendibieu', center: { latitude: 43.2681, longitude: -0.8211 }, population: 284 },
  { geoCode: '64228', postalCode: '64120', city: 'Gabat', center: { latitude: 43.3769, longitude: -1.0283 }, population: 274 },
  { geoCode: '64375', postalCode: '64120', city: 'Méharin', center: { latitude: 43.3313, longitude: -1.1502 }, population: 274 },
  { geoCode: '64543', postalCode: '64430', city: 'Urepel', center: { latitude: 43.0617, longitude: -1.4108 }, population: 271 },
  { geoCode: '64268', postalCode: '64130', city: 'Idaux-Mendy', center: { latitude: 43.1736, longitude: -0.9243 }, population: 267 },
  { geoCode: '64368', postalCode: '64120', city: 'Masparraute', center: { latitude: 43.3945, longitude: -1.0865 }, population: 264 },
  { geoCode: '64008', postalCode: '64220', city: 'Ahaxe-Alciette-Bascassan', center: { latitude: 43.1410, longitude: -1.1571 }, population: 261 },
  { geoCode: '64105', postalCode: '64120', city: 'Béguios', center: { latitude: 43.3531, longitude: -1.1011 }, population: 259 },
  { geoCode: '64441', postalCode: '64120', city: 'Pagolle', center: { latitude: 43.2280, longitude: -1.0033 }, population: 246 },
  { geoCode: '64187', postalCode: '64130', city: 'Charritte-de-Bas', center: { latitude: 43.2970, longitude: -0.8971 }, population: 242 },
  { geoCode: '64049', postalCode: '64120', city: 'Aroue-Ithorots-Olhaïby', center: { latitude: 43.3125, longitude: -0.9290 }, population: 240 },
  { geoCode: '64047', postalCode: '64220', city: 'Arnéguy', center: { latitude: 43.0821, longitude: -1.2787 }, population: 237 },
  { geoCode: '64435', postalCode: '64390', city: 'Osserain-Rivareyte', center: { latitude: 43.3713, longitude: -0.9507 }, population: 235 },
  { geoCode: '64081', postalCode: '64130', city: 'Aussurucq', center: { latitude: 43.1323, longitude: -0.9813 }, population: 230 },
  { geoCode: '64437', postalCode: '64120', city: 'Ostabat-Asme', center: { latitude: 43.2596, longitude: -1.0706 }, population: 226 },
  { geoCode: '64411', postalCode: '64130', city: 'Musculdy', center: { latitude: 43.1781, longitude: -0.9926 }, population: 220 },
  { geoCode: '64019', postalCode: '64120', city: 'Amorots-Succos', center: { latitude: 43.3626, longitude: -1.1273 }, population: 219 },
  { geoCode: '64539', postalCode: '64120', city: 'Uhart-Mixe', center: { latitude: 43.2699, longitude: -1.0167 }, population: 213 },
  { geoCode: '64154', postalCode: '64220', city: 'Bussunarits-Sarrasquette', center: { latitude: 43.1689, longitude: -1.1465 }, population: 210 },
  { geoCode: '64378', postalCode: '64130', city: 'Menditte', center: { latitude: 43.1654, longitude: -0.8832 }, population: 208 },
  { geoCode: '64015', postalCode: '64470', city: 'Alçay-Alçabéhéty-Sunharette', center: { latitude: 43.0834, longitude: -0.9654 }, population: 206 },
  { geoCode: '64283', postalCode: '64220', city: 'Jaxu', center: { latitude: 43.2032, longitude: -1.2096 }, population: 206 },
  { geoCode: '64285', postalCode: '64120', city: 'Juxue', center: { latitude: 43.2286, longitude: -1.0404 }, population: 200 },
  { geoCode: '64487', postalCode: '64120', city: 'Saint-Just-Ibarre', center: { latitude: 43.1619, longitude: -1.0573 }, population: 197 },
  { geoCode: '64327', postalCode: '64220', city: 'Lecumberry', center: { latitude: 43.0850, longitude: -1.1229 }, population: 196 },
  { geoCode: '64342', postalCode: '64560', city: 'Licq-Athérey', center: { latitude: 43.0582, longitude: -0.8836 }, population: 194 },
  { geoCode: '64345', postalCode: '64120', city: 'Lohitzun-Oyhercq', center: { latitude: 43.2710, longitude: -0.9623 }, population: 192 },
  { geoCode: '64031', postalCode: '64270', city: 'Arancou', center: { latitude: 43.4437, longitude: -1.0544 }, population: 187 },
  { geoCode: '64319', postalCode: '64120', city: 'Larribar-Sorhapuru', center: { latitude: 43.2864, longitude: -1.0080 }, population: 187 },
  { geoCode: '64316', postalCode: '64560', city: 'Larrau', center: { latitude: 43.0059, longitude: -0.9806 }, population: 179 },
  { geoCode: '64379', postalCode: '64220', city: 'Mendive', center: { latitude: 43.0842, longitude: -1.0878 }, population: 172 },
  { geoCode: '64509', postalCode: '64470', city: 'Sauguis-Saint-Étienne', center: { latitude: 43.1594, longitude: -0.8740 }, population: 172 },
  { geoCode: '64297', postalCode: '64220', city: 'Lacarre', center: { latitude: 43.1900, longitude: -1.1563 }, population: 171 },
  { geoCode: '64166', postalCode: '64220', city: 'Caro', center: { latitude: 43.1487, longitude: -1.2226 }, population: 170 },
  { geoCode: '64475', postalCode: '64560', city: 'Sainte-Engrâce', center: { latitude: 42.9988, longitude: -0.8264 }, population: 169 },
  { geoCode: '64013', postalCode: '64220', city: 'Ainhice-Mongelos', center: { latitude: 43.2136, longitude: -1.1579 }, population: 168 },
  { geoCode: '64528', postalCode: '64780', city: 'Suhescun', center: { latitude: 43.2347, longitude: -1.1957 }, population: 165 },
  { geoCode: '64115', postalCode: '64130', city: 'Berrogain-Laruns', center: { latitude: 43.2509, longitude: -0.8610 }, population: 160 },
  { geoCode: '64303', postalCode: '64470', city: 'Laguinge-Restoue', center: { latitude: 43.0973, longitude: -0.8492 }, population: 155 },
  { geoCode: '64537', postalCode: '64470', city: 'Trois-Villes', center: { latitude: 43.1402, longitude: -0.8639 }, population: 148 },
  { geoCode: '64272', postalCode: '64120', city: 'Ilharre', center: { latitude: 43.4022, longitude: -1.0332 }, population: 147 },
  { geoCode: '64221', postalCode: '64120', city: 'Etcharry', center: { latitude: 43.3293, longitude: -0.9267 }, population: 144 },
  { geoCode: '64294', postalCode: '64120', city: 'Labets-Biscay', center: { latitude: 43.3906, longitude: -1.0638 }, population: 144 },
  { geoCode: '64150', postalCode: '64120', city: 'Bunus', center: { latitude: 43.2073, longitude: -1.0604 }, population: 133 },
  { geoCode: '64012', postalCode: '64130', city: 'Ainharp', center: { latitude: 43.2551, longitude: -0.9399 }, population: 131 },
  { geoCode: '64341', postalCode: '64130', city: 'Lichos', center: { latitude: 43.3086, longitude: -0.8820 }, population: 127 },
  { geoCode: '64229', postalCode: '64220', city: 'Gamarthe', center: { latitude: 43.1958, longitude: -1.1318 }, population: 125 },
  { geoCode: '64113', postalCode: '64270', city: 'Bergouey-Viellenave', center: { latitude: 43.4257, longitude: -1.0630 }, population: 123 },
  { geoCode: '64468', postalCode: '64130', city: 'Roquiague', center: { latitude: 43.1848, longitude: -0.8416 }, population: 121 },
  { geoCode: '64011', postalCode: '64220', city: 'Aincille', center: { latitude: 43.1352, longitude: -1.1965 }, population: 117 },
  { geoCode: '64298', postalCode: '64470', city: 'Lacarry-Arhan-Charritte-de-Haut', center: { latitude: 43.0733, longitude: -0.9607 }, population: 109 },
  { geoCode: '64162', postalCode: '64470', city: 'Camou-Cihigue', center: { latitude: 43.1195, longitude: -0.9267 }, population: 107 },
  { geoCode: '64155', postalCode: '64220', city: 'Bustince-Iriberry', center: { latitude: 43.1895, longitude: -1.1860 }, population: 102 },
  { geoCode: '64429', postalCode: '64120', city: 'Orsanco', center: { latitude: 43.2896, longitude: -1.0646 }, population: 102 },
  { geoCode: '64265', postalCode: '64120', city: 'Hosta', center: { latitude: 43.1438, longitude: -1.0780 }, population: 100 },
  { geoCode: '64050', postalCode: '64130', city: 'Arrast-Larrebieu', center: { latitude: 43.2824, longitude: -0.8476 }, population: 96 },
  { geoCode: '64432', postalCode: '64470', city: 'Ossas-Suhare', center: { latitude: 43.1390, longitude: -0.9088 }, population: 91 },
  { geoCode: '64258', postalCode: '64470', city: 'Haux', center: { latitude: 43.0590, longitude: -0.8373 }, population: 84 },
  { geoCode: '64340', postalCode: '64470', city: 'Lichans-Sunhar', center: { latitude: 43.0931, longitude: -0.8821 }, population: 84 },
  { geoCode: '64222', postalCode: '64470', city: 'Etchebar', center: { latitude: 43.0674, longitude: -0.9057 }, population: 75 },
  { geoCode: '64267', postalCode: '64120', city: 'Ibarrolle', center: { latitude: 43.1909, longitude: -1.0971 }, population: 73 },
  { geoCode: '64045', postalCode: '64120', city: 'Arhansus', center: { latitude: 43.2569, longitude: -1.0236 }, population: 66 },
  { geoCode: '64107', postalCode: '64220', city: 'Béhorléguy', center: { latitude: 43.1191, longitude: -1.0824 }, population: 66 },
  { geoCode: '64264', postalCode: '64130', city: 'L’Hôpital-Saint-Blaise', center: { latitude: 43.2555, longitude: -0.7708 }, population: 55 },
];

// Generic but plausible street names found in most French communes. Combined
// with the real commune name + postal code + coordinates, this gives realistic
// fake addresses without needing a per-commune street database.
const STREETS = [
  'Rue de l’Église',
  'Rue des Écoles',
  'Place de la Mairie',
  'Grande Rue',
  'Rue Nationale',
  'Rue de la République',
  'Rue Jean Jaurès',
  'Rue Victor Hugo',
  'Rue du 8 Mai 1945',
  'Rue de la Gare',
  'Rue du Stade',
  'Rue des Tilleuls',
  'Rue des Acacias',
  'Allée des Chênes',
  'Impasse des Lilas',
  'Rue de la Loire',
  'Rue du Maine',
  'Rue des Vignes',
  'Chemin des Prés',
  'Rue du Moulin'
];

export interface DemoSeed {
  currentUser: UserDTO;
  establishment: EstablishmentDTO;
}

let cache: DemoSeed | null = null;

/**
 * Populate the in-memory MSW store (`data`) with a coherent and reproducible
 * data set covering the whole Pays Basque EPCI. Safe to call
 * multiple times — only seeds once.
 */
export function seed(): DemoSeed {
  if (cache) {
    return cache;
  }

  // Deterministic data: same content on every reload / deploy.
  faker.seed(20260608);
  faker.setDefaultRefDate('2026-01-01T00:00:00.000Z');

  // --- Establishment -------------------------------------------------------
  const establishment: EstablishmentDTO = {
    ...genEstablishmentDTO(),
    name: 'Test CA du Pays Basque',
    shortName: 'Pays Basque',
    siren: '200067106',
    geoCodes: EPCI_COMMUNES.map((commune) => commune.geoCode),
    available: true
  };
  data.establishments.push(establishment);

  // --- Users ---------------------------------------------------------------
  const currentUser: UserDTO = {
    ...genUserDTO(UserRole.USUAL, { id: establishment.id }),
    email: DEMO_EMAIL,
    firstName: 'Démonstrat',
    lastName: 'ZLV'
  };
  const colleagues = Array.from({ length: 3 }, () =>
    genUserDTO(UserRole.USUAL, { id: establishment.id })
  );
  // currentUser pushed first so it is the default fallback for the auth handler.
  data.users.push(currentUser, ...colleagues);

  // --- Owners --------------------------------------------------------------
  const owners: OwnerDTO[] = Array.from({ length: 180 }, () => genOwnerDTO());
  data.owners.push(...owners);

  // Pick a commune weighted by population, so the distribution looks realistic
  // (Bayonne gets the lion's share, the small communes only a few housings).
  const communeChoices = EPCI_COMMUNES.map((commune) => ({
    weight: commune.population,
    value: commune
  }));

  // --- Housings (+ owners with ranks per housing) --------------------------
  const housings: HousingDTO[] = [];
  for (let index = 0; index < HOUSING_COUNT; index++) {
    const commune = faker.helpers.weightedArrayElement(communeChoices);
    const base = genHousingDTO(commune.geoCode);
    const street = faker.helpers.arrayElement(STREETS);
    const houseNumber = faker.number.int({ min: 1, max: 120 });

    // Occupancy strictly tied to the data source: LOVAC housings are "Vacant",
    // fichiers fonciers housings are "En location".
    const occupancy = faker.helpers.weightedArrayElement([
      { weight: 75, value: Occupancy.VACANT },
      { weight: 25, value: Occupancy.RENT }
    ]);
    const isVacant = occupancy === Occupancy.VACANT;
    // Rented housings come from the fichiers fonciers ("locatif" variant, which
    // is what the "Fichiers fonciers … (en location)" source filter matches),
    // split between 2023 and 2024 so both millésimes are represented.
    const rentFileYear: 'ff-2023-locatif' | 'ff-2024-locatif' =
      faker.helpers.weightedArrayElement([
        { weight: 65, value: 'ff-2023-locatif' as const },
        { weight: 35, value: 'ff-2024-locatif' as const }
      ]);
    const rentDataYear = rentFileYear === 'ff-2024-locatif' ? 2024 : 2023;

    const housing: HousingDTO = {
      ...base,
      rawAddress: [
        `${houseNumber} ${street}`,
        `${commune.postalCode} ${commune.city}`
      ],
      // Real coordinates around the commune centre so the map shows the right
      // place for every housing.
      latitude:
        commune.center.latitude +
        faker.number.float({ min: -0.006, max: 0.006, fractionDigits: 5 }),
      longitude:
        commune.center.longitude +
        faker.number.float({ min: -0.009, max: 0.009, fractionDigits: 5 }),
      occupancy,
      occupancyIntended: null,
      // Every housing starts as "Non suivi" (no sub-status).
      status: HousingStatus.NEVER_CONTACTED,
      subStatus: null,
      // LOVAC 2026 for vacant housings (so they match the default
      // "LOVAC 2026" filter), fichiers fonciers 2023/2024 for rented ones.
      dataFileYears: isVacant ? ['lovac-2026'] : [rentFileYear],
      dataYears: isVacant ? [2026] : [rentDataYear],
      source: isVacant ? 'lovac' : 'datafoncier-import'
    };
    housings.push(housing);

    // 1 primary owner (rank 1) + up to 3 secondary owners (ranks 2..4), so the
    // review flow has meaningful rank-editing to test.
    const ownerCount = faker.number.int({ min: 1, max: 4 });
    const selectedOwners = faker.helpers.arrayElements(owners, ownerCount);
    data.housingOwners.set(
      housing.id,
      selectedOwners.map((owner, rankIndex) => ({
        id: owner.id,
        rank: rankIndex + 1,
        locprop: null,
        idprocpte: null,
        idprodroit: null,
        propertyRight: null,
        relativeLocation: 'same-commune',
        absoluteDistance: 50
      }))
    );
  }
  data.housings.push(...housings);

  // --- Localities (commune filter) -----------------------------------------
  // Register a locality only for communes that actually have housings, so the
  // commune filter lists exactly the communes present in the data.
  const usedGeoCodes = new Set(housings.map((housing) => housing.geoCode));
  EPCI_COMMUNES.filter((commune) => usedGeoCodes.has(commune.geoCode)).forEach(
    (commune) => {
      data.localities.set(commune.geoCode, {
        geoCode: commune.geoCode,
        name: commune.city,
        kind: null,
        taxKind: 'None'
      });
    }
  );

  // --- Groups --------------------------------------------------------------
  const groupHousingsA = housings.slice(0, 12);
  const groupHousingsB = housings.slice(12, 20);
  const groupA: GroupDTO = {
    ...genGroupDTO(currentUser, groupHousingsA),
    title: 'OPAH-RU',
    description:
      'Opération programmée d’amélioration de l’habitat – renouvellement urbain'
  };
  const groupB: GroupDTO = {
    ...genGroupDTO(currentUser, groupHousingsB),
    title: 'Centre-bourg',
    description: 'Logements vacants du centre-bourg'
  };
  data.groups.push(groupA, groupB);
  data.groupHousings.set(
    groupA.id,
    groupHousingsA.map((housing) => ({ id: housing.id }))
  );
  data.groupHousings.set(
    groupB.id,
    groupHousingsB.map((housing) => ({ id: housing.id }))
  );

  // --- Campaign (linked to group A) ----------------------------------------
  const campaignHousings = groupHousingsA;
  const campaign: CampaignDTO = genCampaignDTONext({
    group: groupA,
    author: currentUser,
    housings: campaignHousings,
    sentAt: null
  });
  data.campaigns.push(campaign);
  data.campaignHousings.set(
    campaign.id,
    campaignHousings.map((housing) => ({ id: housing.id }))
  );
  campaignHousings.forEach((housing) => {
    const existing = data.housingCampaigns.get(housing.id) ?? [];
    data.housingCampaigns.set(housing.id, [...existing, { id: campaign.id }]);
  });

  // --- Notes (on a few housings) -------------------------------------------
  housings.slice(0, 5).forEach((housing) => {
    const note = genNoteDTO(currentUser);
    data.notes.push(note);
    data.housingNotes.set(housing.id, [note.id]);
  });

  cache = { currentUser, establishment };
  return cache;
}
