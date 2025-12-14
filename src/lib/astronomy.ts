import * as Astronomy from 'astronomy-engine';
import { MAJOR_CITIES, type City } from "./cities";

export const WGS84 = {
    radiusEquator: 6378.137, // km
    radiusPolar: 6356.752, // km
    flattening: 1 / 298.257223563
};

export interface SeasonEvent {
    date: Date;
    distance: number; // AU
    longitude: number; // Heliocentric Longitude (degrees)
    subSolarLongitude: number; // Geographic Longitude (degrees)
    closestCities: City[];
}

export interface Seasons {
    marchEquinox: SeasonEvent;
    juneSolstice: SeasonEvent;
    sepEquinox: SeasonEvent;
    decSolstice: SeasonEvent;
}

export type SphericalCoords = {
    lat: number;
    lon: number;
};

export type Vector3D = {
    x: number;
    y: number;
    z: number;
};

/**
 * Returns the position of the Earth in the Heliocentric coordinate system (J2000).
 * Scale: 1 unit = 1 AU (Astronomical Unit) typically, but astronomy-engine uses AU for HelioVector?
 * Checking docs/types: HelioVector returns AU.
 */
export function getEarthOrbitPosition(date: Date): Vector3D {
    const vector = Astronomy.HelioVector(Astronomy.Body.Earth, date);
    // vector is {x, y, z} in AU (J2000 Equatorial)

    // Rotate around X axis by -Obliquity to flatten the orbit (convert to Ecliptic)
    const eps = getObliquity() * (Math.PI / 180);
    const cosE = Math.cos(eps);
    const sinE = Math.sin(eps);

    // Rotation X(-eps):
    // x' = x
    // y' = y*cos - z*sin
    // z' = y*sin + z*cos  <-- No, rotating J2000 Equ to Ecliptic means rotating X axis by +eps? or -eps?
    // J2000 Z is Celestial Pole. Ecliptic Z is Ecliptic Pole.
    // Celestial Pole is TILTED relative to Ecliptic Pole.
    // We want Ecliptic Z to be UP (Y in Three.js terms, or Z in Astro terms).
    // So we want to rotate J2000 such that Ecliptic Plane becomes XY plane.
    // Equator is inclined to Ecliptic.
    // Rotation is around X axis (Vernal Equinox).
    // To bring Equator P (inclined) to Ecliptic P (vertical), we rotate by Obliquity.
    // Vector rotation:
    const y_ecl = vector.y * cosE + vector.z * sinE;
    const z_ecl = -vector.y * sinE + vector.z * cosE;

    return { x: vector.x, y: y_ecl, z: z_ecl };
}

/**
 * Returns the position of the Sun relative to an observer on Earth.
 */
export function getSunPosition(date: Date, location: SphericalCoords) {
    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
    const equator = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
    const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec, 'normal');
    return {
        azimuth: horizon.azimuth,
        altitude: horizon.altitude
    };
}

/**
 * Get sunrise and sunset times for a location.
 */
export function getSunTimes(date: Date, location: SphericalCoords) {
    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
    // Check events for the given date's day (UTC or local?). Astronomy engine usually searches forward?
    // MakeSearchRiseSet returns the event.
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, date, 1);
    const set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 1);

    return {
        sunrise: rise ? rise.date : null,
        sunset: set ? set.date : null // date property of the event
    };
}

// ... (existing code helpers)

export function getSubSolarLongitude(date: Date): number {
    // 1. Get Sun's position logic
    // We need the Greenwhich Apparent Sidereal Time (GAST) to know Earth's rotation
    const gast = Astronomy.SiderealTime(date);

    // We need Sun's Right Ascension (RA)
    const observer = new Astronomy.Observer(0, 0, 0); // Correct constructor usage
    const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, date, observer, false, true);

    // Hour Angle (HA) = Local Sidereal Time (LST) - Right Ascension (RA)
    // At the sub-solar point, the Sun is at the zenith, so Hour Angle = 0.
    // LST = GAST + Longitude
    // 0 = (GAST + Longitude) - RA
    // Longitude = RA - GAST

    let lon = sunEquator.ra - gast;

    // Normalize to -180 to 180 (geographic longitude)
    // RA and GAST are in hours (0-24), map to degrees (0-360) first?
    // Astronomy.ts handles RA/GAST in hours usually. Let's check docs or source if available.
    // Assuming hours:
    lon = lon * 15; // Convert hours to degrees

    // Normalize to [-180, 180]
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;

    return lon;
}

function getClosestCities(date: Date): City[] {
    const targetLon = getSubSolarLongitude(date);

    // Calculate distance for all cities
    // We only care about Longitude difference for "time" matching (closest to noon)
    // User asked "closest longitude".

    const sorted = [...MAJOR_CITIES].sort((a, b) => {
        // Handle wrapping (e.g. 179 and -179 are close)
        let diffA = Math.abs(a.lon - targetLon);
        if (diffA > 180) diffA = 360 - diffA;

        let diffB = Math.abs(b.lon - targetLon);
        if (diffB > 180) diffB = 360 - diffB;

        return diffA - diffB;
    });

    return sorted.slice(0, 3);
}

/**
 * Calculates the heliocentric longitude of the Earth for a given date.
 * @param date The date for which to calculate the longitude.
 * @returns Heliocentric longitude in degrees [0, 360).
 */
function getHeliocentricLongitude(date: Date): number {
    const pos = Astronomy.HelioVector(Astronomy.Body.Earth, date);
    // Calculate heliocentric longitude
    // atan2(y, x) gives angle in radians. Convert to degrees.
    // Range [-180, 180]. Normalize to [0, 360].
    let lonDeg = Math.atan2(pos.y, pos.x) * (180 / Math.PI);
    if (lonDeg < 0) lonDeg += 360;
    return lonDeg;
}

/**
 * Get solstices and equinoxes for a year with detailed info.
 */
export function getSeasons(year: number): Seasons {
    const seasons = Astronomy.Seasons(year);

    function makeEvent(d: Astronomy.AstroTime): SeasonEvent { // Use correct type
        const date = d.date;
        // const dist = Astronomy.Illumination(Astronomy.Body.Sun, d).mag; // Not distance, check Illumination struct? Use HelioVector for dist.
        const hv = Astronomy.HelioVector(Astronomy.Body.Earth, d);
        const distance = Math.sqrt(hv.x * hv.x + hv.y * hv.y + hv.z * hv.z);

        return {
            date: date,
            distance: distance,
            longitude: getHeliocentricLongitude(date),
            subSolarLongitude: getSubSolarLongitude(date),
            closestCities: getClosestCities(date)
        };
    }

    return {
        marchEquinox: makeEvent(seasons.mar_equinox),
        juneSolstice: makeEvent(seasons.jun_solstice),
        sepEquinox: makeEvent(seasons.sep_equinox),
        decSolstice: makeEvent(seasons.dec_solstice),
    };
}

/**
 * Get perihelion and aphelion for a year.
 */
export function getApsis(year: number) {
    return {
        perihelion: findExtremumDistance(year, 0, 4, true), // Jan
        aphelion: findExtremumDistance(year, 6, 4, false)  // July
    };
}



function findExtremumDistance(year: number, month: number, day: number, isMin: boolean) {
    let bestDate = new Date(year, month, day);
    let bestDist = Astronomy.HelioVector(Astronomy.Body.Earth, bestDate).Length();

    // Simple gradient descent / scan
    for (let i = -10; i <= 10; i++) {
        const d = new Date(year, month, day + i);
        const dist = Astronomy.HelioVector(Astronomy.Body.Earth, d).Length();
        if ((isMin && dist < bestDist) || (!isMin && dist > bestDist)) {
            bestDist = dist;
            bestDate = d;
        }
    }
    return bestDate;
}

/**
 * Calculate axial tilt (obliquity of the ecliptic) for visual usage.
 * J2000 obliquity is ~23.44 degrees.
 * Astronomy engine provides this via various calcs, but static approximation is okay for simple visual,
 * or we can get exact if needed.
 */
export function getObliquity() {
    // Mean obliquity of ecliptic J2000
    return 23.4392911;
}

/**
 * Returns the rotation of the Earth in radians for the given date.
 * Based on Greenwich Apparent Sidereal Time (GAST).
 */
export function getEarthRotation(date: Date) {
    const gast = Astronomy.SiderealTime(date); // Hours [0, 24)
    return (gast / 24) * 2 * Math.PI;
}
