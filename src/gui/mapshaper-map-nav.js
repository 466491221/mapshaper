/* @requires
mapshaper-gui-lib
mapshaper-highlight-box
*/

function MapNav(gui, ext, mouse) {
  var wheel = new MouseWheel(mouse),
      zoomBox = new HighlightBox('body'),
      zoomTween = new Tween(Tween.sineInOut),
      shiftDrag = false,
      zoomScale = 1.5,
      zoomScaleMultiplier = 1,
      inBtn, outBtn,
      dragStartEvt,
      _fx, _fy; // zoom foci, [0,1]

  this.setZoomFactor = function(k) {
    zoomScaleMultiplier = k || 1;
  };

  gui.map.addSidebarButton("#home-icon").on('click', function() {
    gui.dispatchEvent('map_reset');
  });

  inBtn = gui.map.addSidebarButton("#zoom-in-icon").on('click', zoomIn);
  outBtn = gui.map.addSidebarButton("#zoom-out-icon").on('click', zoomOut);

  ext.on('change', function() {
    inBtn.classed('disabled', ext.scale() >= ext.maxScale());
  });

  gui.on('map_reset', function() {
    ext.home();
  });

  zoomTween.on('change', function(e) {
    ext.zoomToExtent(e.value, _fx, _fy);
  });

  mouse.on('dblclick', function(e) {
    zoomByPct(1 + zoomScale * zoomScaleMultiplier, e.x / ext.width(), e.y / ext.height());
  });

  mouse.on('dragstart', function(e) {
    shiftDrag = !!e.shiftKey;
    if (shiftDrag) {
      dragStartEvt = e;
    }
  });

  mouse.on('drag', function(e) {
    if (shiftDrag) {
      zoomBox.show(e.pageX, e.pageY, dragStartEvt.pageX, dragStartEvt.pageY);
    } else {
      ext.pan(e.dx, e.dy);
    }
  });

  mouse.on('dragend', function(e) {
    var bounds;
    if (shiftDrag) {
      shiftDrag = false;
      bounds = new Bounds(e.x, e.y, dragStartEvt.x, dragStartEvt.y);
      zoomBox.hide();
      if (bounds.width() > 5 && bounds.height() > 5) {
        zoomToBox(bounds);
      }
    }
  });

  wheel.on('mousewheel', function(e) {
    var k = 1 + (0.11 * e.multiplier * zoomScaleMultiplier),
        delta = e.direction > 0 ? k : 1 / k;
    ext.zoomByPct(delta, e.x / ext.width(), e.y / ext.height());
  });

  function zoomIn() {
    zoomByPct(1 + zoomScale * zoomScaleMultiplier, 0.5, 0.5);
  }

  function zoomOut() {
    zoomByPct(1/(1 + zoomScale * zoomScaleMultiplier), 0.5, 0.5);
  }

  // @box Bounds with pixels from t,l corner of map area.
  function zoomToBox(box) {
    var pct = Math.max(box.width() / ext.width(), box.height() / ext.height()),
        fx = box.centerX() / ext.width() * (1 + pct) - pct / 2,
        fy = box.centerY() / ext.height() * (1 + pct) - pct / 2;
    zoomByPct(1 / pct, fx, fy);
  }

  // @pct Change in scale (2 = 2x zoom)
  // @fx, @fy zoom focus, [0, 1]
  function zoomByPct(pct, fx, fy) {
    var w = ext.getBounds().width();
    _fx = fx;
    _fy = fy;
    zoomTween.start(w, w / pct, 400);
  }
}
