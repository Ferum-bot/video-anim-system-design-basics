/**
 * The European backbone, roughly as it really is.
 *
 * Hubs are the cities that actually carry the traffic — the "FLAP" core (Frankfurt, London,
 * Amsterdam, Paris) plus Moscow are the four-and-a-bit exchanges that peak above 3 Tbps,
 * with DE-CIX Frankfurt the largest in the world by peak throughput. Links follow published
 * long-haul corridors rather than straight lines on a map: the FLAP mesh, the two diverse
 * Frankfurt→Mediterranean paths (via Zurich/Milan and via Lyon/Geneva/Marseille), the Baltic
 * and Scandinavian rings, and the three separate ways traffic actually leaves Moscow —
 * through Scandinavia, through the Baltics/Poland, and through Ukraine.
 *
 * Coordinates are city centres in degrees; nothing here is precise to the street, and it
 * doesn't need to be — the point on screen is the shape of the mesh.
 */

export type Tier = 1 | 2 | 3;

export interface Place {
  readonly id: string;
  readonly label: string;
  readonly lon: number;
  readonly lat: number;
  readonly tier: Tier;
}

export interface Link {
  readonly from: string;
  readonly to: string;
  /** Trunk routes are drawn heavier than the rest. */
  readonly trunk?: boolean;
}

export const PLACES: readonly Place[] = [
  // The exchanges that carry the continent
  {id: 'fra', label: 'ФРАНКФУРТ', lon: 8.68, lat: 50.11, tier: 1},
  {id: 'ams', label: 'АМСТЕРДАМ', lon: 4.9, lat: 52.37, tier: 1},
  {id: 'lon', label: 'ЛОНДОН', lon: -0.13, lat: 51.51, tier: 1},
  {id: 'par', label: 'ПАРИЖ', lon: 2.35, lat: 48.86, tier: 1},
  {id: 'msk', label: 'МОСКВА', lon: 37.62, lat: 55.75, tier: 1},

  // Major regional hubs
  {id: 'mrs', label: 'МАРСЕЛЬ', lon: 5.37, lat: 43.3, tier: 2},
  {id: 'mil', label: 'МИЛАН', lon: 9.19, lat: 45.46, tier: 2},
  {id: 'mad', label: 'МАДРИД', lon: -3.7, lat: 40.42, tier: 2},
  {id: 'sto', label: 'СТОКГОЛЬМ', lon: 18.07, lat: 59.33, tier: 2},
  {id: 'waw', label: 'ВАРШАВА', lon: 21.01, lat: 52.23, tier: 2},
  {id: 'vie', label: 'ВЕНА', lon: 16.37, lat: 48.21, tier: 2},
  {id: 'zrh', label: 'ЦЮРИХ', lon: 8.54, lat: 47.38, tier: 2},
  {id: 'ber', label: 'БЕРЛИН', lon: 13.4, lat: 52.52, tier: 2},
  {id: 'cph', label: 'КОПЕНГАГЕН', lon: 12.57, lat: 55.68, tier: 2},
  {id: 'spb', label: 'САНКТ-ПЕТЕРБУРГ', lon: 30.31, lat: 59.94, tier: 2},

  // Everything else that gives the mesh its shape
  {id: 'dub', label: 'ДУБЛИН', lon: -6.26, lat: 53.35, tier: 3},
  {id: 'bru', label: 'БРЮССЕЛЬ', lon: 4.35, lat: 50.85, tier: 3},
  {id: 'ham', label: 'ГАМБУРГ', lon: 9.99, lat: 53.55, tier: 3},
  {id: 'muc', label: 'МЮНХЕН', lon: 11.58, lat: 48.14, tier: 3},
  {id: 'prg', label: 'ПРАГА', lon: 14.44, lat: 50.08, tier: 3},
  {id: 'bud', label: 'БУДАПЕШТ', lon: 19.04, lat: 47.5, tier: 3},
  {id: 'buh', label: 'БУХАРЕСТ', lon: 26.1, lat: 44.43, tier: 3},
  {id: 'sof', label: 'СОФИЯ', lon: 23.32, lat: 42.7, tier: 3},
  {id: 'ist', label: 'СТАМБУЛ', lon: 28.98, lat: 41.01, tier: 3},
  {id: 'bcn', label: 'БАРСЕЛОНА', lon: 2.17, lat: 41.39, tier: 3},
  {id: 'lyo', label: 'ЛИОН', lon: 4.84, lat: 45.76, tier: 3},
  {id: 'gva', label: 'ЖЕНЕВА', lon: 6.14, lat: 46.2, tier: 3},
  {id: 'osl', label: 'ОСЛО', lon: 10.75, lat: 59.91, tier: 3},
  {id: 'hel', label: 'ХЕЛЬСИНКИ', lon: 24.94, lat: 60.17, tier: 3},
  {id: 'rix', label: 'РИГА', lon: 24.11, lat: 56.95, tier: 3},
  {id: 'poz', label: 'ПОЗНАНЬ', lon: 16.93, lat: 52.41, tier: 3},
  {id: 'msq', label: 'МИНСК', lon: 27.57, lat: 53.9, tier: 3},
  {id: 'iev', label: 'КИЕВ', lon: 30.52, lat: 50.45, tier: 3},
];

export const LINKS: readonly Link[] = [
  // FLAP core — the busiest mesh on the continent
  {from: 'lon', to: 'ams', trunk: true},
  {from: 'lon', to: 'par', trunk: true},
  {from: 'lon', to: 'fra', trunk: true},
  {from: 'ams', to: 'fra', trunk: true},
  {from: 'par', to: 'fra', trunk: true},
  {from: 'ams', to: 'par'},
  {from: 'lon', to: 'bru'},
  {from: 'bru', to: 'ams'},
  {from: 'bru', to: 'par'},
  {from: 'lon', to: 'dub'},

  // Frankfurt → Mediterranean, the two diverse paths
  {from: 'fra', to: 'zrh', trunk: true},
  {from: 'zrh', to: 'mil', trunk: true},
  {from: 'par', to: 'lyo'},
  {from: 'lyo', to: 'gva'},
  {from: 'gva', to: 'mil'},
  {from: 'lyo', to: 'mrs'},
  {from: 'par', to: 'mrs', trunk: true},
  {from: 'mrs', to: 'mil'},

  // Iberia
  {from: 'mrs', to: 'bcn'},
  {from: 'bcn', to: 'mad'},
  {from: 'par', to: 'mad'},

  // Germany and the Alps
  {from: 'fra', to: 'ham'},
  {from: 'ham', to: 'ams'},
  {from: 'fra', to: 'muc'},
  {from: 'muc', to: 'mil'},
  {from: 'muc', to: 'vie'},
  {from: 'fra', to: 'ber', trunk: true},
  {from: 'ber', to: 'prg'},
  {from: 'prg', to: 'vie'},
  {from: 'fra', to: 'prg'},

  // South-east
  {from: 'vie', to: 'bud'},
  {from: 'bud', to: 'buh'},
  {from: 'buh', to: 'sof'},
  {from: 'sof', to: 'ist'},
  {from: 'bud', to: 'sof'},
  {from: 'mil', to: 'vie'},

  // Nordics
  {from: 'ham', to: 'cph'},
  {from: 'ber', to: 'cph'},
  {from: 'cph', to: 'sto', trunk: true},
  {from: 'osl', to: 'sto'},
  {from: 'osl', to: 'cph'},
  {from: 'sto', to: 'hel', trunk: true},
  {from: 'sto', to: 'rix'},

  // Baltic corridor — the second diverse path back to Western Europe
  {from: 'ber', to: 'poz', trunk: true},
  {from: 'poz', to: 'waw', trunk: true},
  {from: 'waw', to: 'rix'},
  {from: 'rix', to: 'spb'},
  {from: 'waw', to: 'vie'},
  {from: 'waw', to: 'prg'},

  // The three ways out of Moscow
  {from: 'msk', to: 'spb', trunk: true}, // …then Scandinavia
  {from: 'spb', to: 'hel', trunk: true},
  {from: 'msk', to: 'msq', trunk: true}, // …then Poland
  {from: 'msq', to: 'waw', trunk: true},
  {from: 'msk', to: 'iev', trunk: true}, // …then Ukraine
  {from: 'iev', to: 'waw'},
  {from: 'iev', to: 'bud'},
];

export const PLACE_BY_ID: ReadonlyMap<string, Place> = new Map(
  PLACES.map(place => [place.id, place]),
);
