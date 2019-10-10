var api = require('../'),
    assert = require('assert');


describe('mapshaper-data-fill.js', function () {

  it('works for simple case', function(done) {
    // two adjacent boxes
    //
    //  . --- . --- .
    //  |     |     |
    //  |     |     |
    //  . --- . --- .
    //
    var input = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {state: ''},
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
        }
      }, {
        type: 'Feature',
        properties: {state: 'IL'},
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 0], [1, 1], [2, 1], [2, 0], [1, 0]]]
        }
      }]
    };

    api.applyCommands('-i polygons.json -data-fill field=state -o',
      {'polygons.json': input}, function(err, output) {
        var features = JSON.parse(output['polygons.json']).features;
        assert.equal(features[0].properties.state, 'IL');
        assert.equal(features[1].properties.state, 'IL');
        done();
      });

  })

  it('contiguous option does not remove ordinary islands', function(done) {
    //
    //  . --------- .
    //  |           |
    //  |   . - .   |
    //  |   |   |   |
    //  |   . - .   |
    //  |           |
    //  . --------- .
    //
    var input = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {state: 'outer'},
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 4], [4, 4], [4, 1], [1, 1], [1, 4]], [[2, 3], [3, 3], [3, 2], [2, 2], [2, 3]]]
        }
      }, {
        type: 'Feature',
        properties: {state: 'inner'},
        geometry: {
          type: 'Polygon',
          coordinates: [[[2, 3], [3, 3], [3, 2], [2, 2], [2, 3]]]
        }
      }]
    };

    api.applyCommands('-i polygons.json -data-fill field=state contiguous -o',
      {'polygons.json': input}, function(err, output) {
        var features = JSON.parse(output['polygons.json']).features;
        assert.equal(features[0].properties.state, 'outer');
        assert.equal(features[1].properties.state, 'inner');
        done();
      });

  });


  it('contiguous removes breakaway islands', function(done) {
    //
    // . --------------- .
    // |                 |
    // |  . --------- .  |
    // |  |           |  |
    // |  |   . - .   |  |
    // |  |   |   |   |  |
    // |  |   . - .   |  |
    // |  |           |  |
    // |  . --------- .  |
    // |                 |
    // . --------------- .
    //
    var input = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {state: 'a'},
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 5], [5, 5], [5, 0], [0, 0], [0, 5]], [[1, 4], [4, 4], [4, 1], [1, 1], [1, 4]]]
        }
      },{
        type: 'Feature',
        properties: {state: 'b'},
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 4], [4, 4], [4, 1], [1, 1], [1, 4]], [[2, 3], [3, 3], [3, 2], [2, 2], [2, 3]]]
        }
      }, {
        type: 'Feature',
        properties: {state: 'a'},
        geometry: {
          type: 'Polygon',
          coordinates: [[[2, 3], [3, 3], [3, 2], [2, 2], [2, 3]]]
        }
      }]
    };

    api.applyCommands('-i polygons.json -data-fill field=state contiguous -o',
      {'polygons.json': input}, function(err, output) {
        var features = JSON.parse(output['polygons.json']).features;
        assert.equal(features[0].properties.state, 'a');
        assert.equal(features[1].properties.state, 'b');
        assert.equal(features[2].properties.state, 'b');
       done();
      });

  });

  it('works for numerical values, including 0', function(done) {
    // three adjacent boxes
    //
    //  . --- . --- . --- .
    //  |     |     |     |
    //  |     |     |     |
    //  . --- . --- . --- .
    //
    var input = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {id: 0},
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
        }
      }, {
        type: 'Feature',
        properties: {id: null},
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 0], [1, 1], [2, 1], [2, 0], [1, 0]]]
        }
      }, {
        type: 'Feature',
        properties: {id: null},
        geometry: {
          type: 'Polygon',
          coordinates: [[[2, 0], [2, 1], [3, 1], [3, 0], [2, 0]]]
        }
      }]
    };

    api.applyCommands('-i polygons.json -data-fill field=id -o',
      {'polygons.json': input}, function(err, output) {
        var features = JSON.parse(output['polygons.json']).features;
        assert.equal(features[0].properties.id, 0);
        assert.equal(features[1].properties.id, 0);
        assert.equal(features[2].properties.id, 0);
        done();
      });

  })


})
