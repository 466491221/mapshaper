/* @requires mapshaper-mixed-projection */

// some aliases
internal.projectionIndex = {
  robinson: '+proj=robin +datum=WGS84',
  webmercator: '+proj=merc +a=6378137 +b=6378137',
  wgs84: '+proj=longlat +datum=WGS84',
  albersusa: getAlbersUSA(),
  albersusa2: getAlbersUSA({PR: true}) // version with Puerto Rico
};

// This stub is replaced when loaded in GUI, which may need to load some files
internal.initProjLibrary = function(opts, done) {done();};

// Find Proj.4 definition file names in strings like "+init=epsg:3000"
// (Used by GUI, defined here for testing)
internal.findProjLibs = function(str) {
  var matches = str.match(/\b(esri|epsg|nad83|nad27)(?=:[0-9]+\b)/ig) || [];
  return utils.uniq(matches.map(function(str) {return str.toLowerCase();}));
};

internal.getProjInfo = function(dataset) {
  var P, info;
  try {
    P = internal.getDatasetCRS(dataset);
    if (P) {
      info = internal.crsToProj4(P);
    }
  } catch(e) {}
  return info || "[unknown]";
};

internal.crsToProj4 = function(P) {
  return require('mproj').internal.get_proj_defn(P);
};

internal.crsToPrj = function(P) {
  var wkt;
  try {
    wkt = require('mproj').internal.wkt_from_proj4(P);
  } catch(e) {

  }
  return wkt;
};

internal.crsAreEqual = function(a, b) {
  var str = internal.crsToProj4(a);
  return !!str && str == internal.crsToProj4(b);
};

internal.getProjDefn = function(str) {
  var mproj = require('mproj');
  var defn;
  if (str in internal.projectionIndex) {
    defn = internal.projectionIndex[str];
  } else if (str in mproj.internal.pj_list) {
    defn = '+proj=' + str;
  } else if (/^\+/.test(str)) {
    defn = str;
  } else {
    stop("Unknown projection definition:", str);
  }
  return defn;
};

internal.getCRS = function(str) {
  var defn = internal.getProjDefn(str);
  var P;
  if (typeof defn == 'function') {
    P = defn();
  } else {
    try {
      P = require('mproj').pj_init(defn);
    } catch(e) {
      stop('Unable to use projection', defn, '(' + e.message + ')');
    }
  }
  return P || null;
};

// @info: info property of source dataset (instead of crs object, so wkt string
//        can be preserved if present)
internal.setDatasetCRS = function(dataset, info) {
  dataset.info = dataset.info || {};
  // Assumes that proj4 object is never mutated.
  // TODO: assign a copy of crs (if present)
  dataset.info.crs = info.crs;
  dataset.info.prj = info.prj;
};

internal.getDatasetCRS = function(dataset) {
  var info = dataset.info || {},
      P = info.crs;
  if (!P && info.prj) {
    P = internal.parsePrj(info.prj);
  }
  if (!P && internal.probablyDecimalDegreeBounds(internal.getDatasetBounds(dataset))) {
    // use wgs84 for probable latlong datasets with unknown datums
    P = internal.getCRS('wgs84');
  }
  return P;
};

// Assumes conformal projections; consider returning average of vertical and
// horizontal scale factors.
// x, y: a point location in projected coordinates
// Returns k, the ratio of coordinate distance to distance on the ground
internal.getScaleFactorAtXY = function(x, y, crs) {
  var proj = require('mproj');
  var dist = 1;
  var lp = proj.pj_inv_deg({x: x, y: y}, crs);
  var lp2 = proj.pj_inv_deg({x: x + dist, y: y}, crs);
  var k = dist / greatCircleDistance(lp.lam, lp.phi, lp2.lam, lp2.phi);
  return k;
};

internal.isProjectedCRS = function(P) {
  return P && P.is_latlong || false;
};

internal.isLatLngCRS = function(P) {
  return P && P.is_latlong || false;
};

internal.printProjections = function() {
  var index = require('mproj').internal.pj_list;
  var msg = 'Proj4 projections\n';
  Object.keys(index).sort().forEach(function(id) {
    msg += '  ' + utils.rpad(id, 7, ' ') + '  ' + index[id].name + '\n';
  });
  msg += '\nAliases';
  Object.keys(internal.projectionIndex).sort().forEach(function(n) {
    msg += '\n  ' + n;
  });
  message(msg);
};

internal.translatePrj = function(str) {
  var proj4;
  try {
    proj4 = require('mproj').internal.wkt_to_proj4(str);
  } catch(e) {
    stop('Unusable .prj file (' + e.message + ')');
  }
  return proj4;
};

// Convert contents of a .prj file to a projection object
internal.parsePrj = function(str) {
  return internal.getCRS(internal.translatePrj(str));
};
