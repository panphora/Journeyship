var selectedBackgroundImage;

var defaultCellSize = 60;
var defaultEditCellSize = 30;
var defaultTinyCellSize = 3;
var defaultCellColor = '#fff';

var $deleteFromMainCanvasButton = $('#delete-block-from-main-canvas');
var $editInMainCanvasButton = $('#edit-block-from-main-canvas');
var $exportBlockButton = $('#export-block');

var $editorAreaContainer = $('#constructor-container');

var colors = [];
colors.push('#ffc0cb'); // light pink
colors.push('#ff1493');
colors.push('#dc143c');
colors.push('#ff0000'); // red
colors.push('#ffe3d2'); // skin color
colors.push('#fdd7c0'); // skin color
colors.push('#d2b48c'); // skin color
colors.push('#d39b86');
colors.push('#844206'); // brown
colors.push('#ff6600'); // orange
colors.push('#ffa502');
colors.push('#feff04'); //yellow
colors.push('#7cfc00'); // green
colors.push('#32cd32'); // green
colors.push('#00a500'); // green
colors.push('#e0ffff'); // blue
colors.push('#87ceeb'); // blue
colors.push('#1c00ff'); // blue
colors.push('#08007f'); // dark blue
colors.push('#ee83ee'); // purple
colors.push('#9400d3'); // purple
colors.push('transparent');
colors.push('#ffffff'); // white
colors.push('#d3d3d3');
colors.push('#c0c0c0');
colors.push('#a9a9a9');
colors.push('#808080');
colors.push('#696969');
colors.push('#474747');
colors.push('#222222');
colors.push('#000000'); // black


// setup animated block

function generatePrerenderedLayers(layers) {
  var prerenderedLayers = [];
  _.each(layers, function (layer) {
    var canvasLayer = document.createElement('canvas');
    canvasLayer.width = defaultCellSize;
    canvasLayer.height = defaultCellSize;
    var canvasContext = canvasLayer.getContext('2d');
    applyMapToContext(layer, canvasContext, defaultTinyCellSize, defaultCellSize / defaultTinyCellSize);
    prerenderedLayers.push(canvasLayer);
  });

  return prerenderedLayers;
}

function AnimatedBlock (layers, options) {
  var defaults = {
    uniqueId: _.uniqueId('id-'),
    fromMainCanvas: false,
    type: null,
    direction: null
  };

  _.extend(defaults, options);

  var self = this;
  self.layers = [];
  self.prerenderedLayers = [];
  self.layerIndex = 0;
  self.animationInterval = null;
  self.$animatedElement = null;
  self.uniqueId = defaults.uniqueId;
  self.fromMainCanvas = defaults.fromMainCanvas;
  self.mainCanvasPosition = defaults.mainCanvasPosition;
  self.mainCanvasOnBackground = defaults.mainCanvasOnBackground;
  self.type = defaults.type;
  self.direction = defaults.direction;

  _.each(layers, function (layer) {
    self.addLayer(layer);
  });

  self.prerenderedLayers = generatePrerenderedLayers(self.layers);
}

AnimatedBlock.prototype.regeneratePrerenderedLayers = function () {
  this.prerenderedLayers = generatePrerenderedLayers(this.layers);
};

AnimatedBlock.prototype.clearAnimation = function () {
  this.$animatedElement[0].getContext('2d').clearRect(0,0,this.$animatedElement[0].width,this.$animatedElement[0].height);
};

AnimatedBlock.prototype.resetIndex = function () {
  this.layerIndex = 0;
};

AnimatedBlock.prototype.addLayer = function (value, layerNumOption) {
  var layer = [];
  if (typeof value === 'string') {
    var color = value;
    _.times(Math.pow((defaultCellSize / defaultTinyCellSize), 2), function () {
      layer.push(color);
    });
  } else if (typeof value === 'object') {
    layer = value;
  }

  var layerNum = typeof(layerNumOption) === 'number' ? layerNumOption : this.layers.length;
  this.layers.splice(layerNum, 0, layer);

  $.publish('added-layer', {
    layer: layer,
    animatedBlock: this,
    layerNum: layerNum
  });

  this.prerenderedLayers = generatePrerenderedLayers(this.layers);
};

AnimatedBlock.prototype.addLayers = function (layers) {
  var self = this;

  _.each(layers, function (layer) {
    self.addLayer(layer);
  });
};


AnimatedBlock.prototype.changeLayerValue = function (layerNum, indexNum, newValue) {
  if (!this.layers[layerNum]) {
    throw("Attempted to change a layer value of a layer that doesn't exist");
  }

  this.layers[layerNum][indexNum] = newValue;

  this.prerenderedLayers = generatePrerenderedLayers(this.layers);
};

AnimatedBlock.prototype.removeLayer = function (layerNum) {
  this.layers.splice(layerNum, 1);
  $.publish('removed-layer', layerNum);

  this.prerenderedLayers = generatePrerenderedLayers(this.layers);
};

AnimatedBlock.prototype.removeAllLayers = function () {
  var self = this;
  _.each(self.layers, function (layer, index) {
    self.removeLayer(0);
  });

  self.prerenderedLayers = generatePrerenderedLayers(self.layers);
};

AnimatedBlock.prototype.nextLayer = function () {
  return this.layers[this.nextLayerNum()];
};

AnimatedBlock.prototype.nextLayerNum = function () {
  if (this.layers.length) {
    var newLayerIndex = this.layerIndex;

    if (this.layerIndex + 1 === this.layers.length) {
      this.layerIndex = 0;
    } else {
      this.layerIndex = this.layerIndex + 1;
    }

    return newLayerIndex;
  }
};

AnimatedBlock.prototype.animate = function () {
  var self = this;

  if (this.layers.length) {
    var context = self.$animatedElement[0].getContext('2d');
    self.clearAnimation();
    if (this.prerenderedLayers.length) {
      var prerenderedLayer = this.prerenderedLayers[this.nextLayerNum()];
      context.drawImage(prerenderedLayer, 0, 0);
    }
  }
};

AnimatedBlock.prototype.startAnimation = function () {
  var self = this;
  var fps = 3;

  self.animationInterval = setInterval(function () {
    self.animate();
  }, 1000 / fps);
};

AnimatedBlock.prototype.pauseAnimation = function () {
  clearInterval(this.animationInterval);
};

// canvas helper functions

function drawCell (context, x, y, size, color) {
  if (!color) color = defaultCellColor;
  if (!size) size = defaultCellSize;

  context.fillStyle = color;
  context.fillRect(x,y,size,size);
}

function drawOutline (context, x, y, size, color) {
  if (!color) color = defaultCellColor;
  if (!size) size = defaultCellSize;

  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(x-0.5,y - 0.5);
  context.lineTo(x+60.5, y - 0.5);
  context.lineTo(x+60.5, y +60.5);
  context.lineTo(x-0.5, y+60.5);
  context.lineTo(x-0.5, y-0.5);
  context.stroke();
}

function clearCell (context, x, y, size) {
  if (!size) size = defaultCellSize;

  context.clearRect(x,y,size,size);
}

function getCellPositionInArrayFromPosition (x, y, cellSize, columns) {
  var rowAndColumn = getCellRowAndColumnFromPosition(x, y, cellSize);
  return getCellPositionInArray(rowAndColumn.row, rowAndColumn.column, columns);
}

// input x, y and outputs x and y rounded down to the nearest multiple of cellSize
function getCellPosition (x, y, cellSize) {
  if (!cellSize) {
    cellSize = defaultCellSize;
  }

  return {
    x: Math.floor(x/cellSize) * cellSize,
    y: Math.floor(y/cellSize) * cellSize
  };
}

function getCellRowAndColumnFromIndex (index, containerColumns) {
  return {
    row: Math.floor(index / containerColumns),
    column: index % containerColumns
  };
}

function getCellIndexFromRowAndColumn (row, column, columns) {
  return (columns * row) + column;
}

function getCellRowAndColumnFromPosition (x, y, cellSize) {
  if (!cellSize) {
    cellSize = defaultCellSize;
  }

  return {
    row: Math.floor(y / cellSize),
    column: Math.floor(x / cellSize)
  };
}

function getCellPositionInArray (row, column, containerColumns) {
  return containerColumns * row + column;
}

function getCellPositionFromRowAndColumn (row, column, cellSize) {
  if (!cellSize) {
    cellSize = defaultCellSize;
  }

  return {
    x: column * cellSize,
    y: row * cellSize
  };
}

function getCellPositionFromIndex (index, columns, cellSize) {
  if (!cellSize) {
    cellSize = defaultCellSize;
  }

  var rowAndColumn = getCellRowAndColumnFromIndex(index, columns);
  return getCellPositionFromRowAndColumn(rowAndColumn.row, rowAndColumn.column, cellSize);
}

function applyMapToContext (map, context, cellSize, columns, options) {
  var defaults = {
    x: 0,
    y: 0,
    withTransparency: false
  };

  _.extend(defaults, options);

  _.each(map, function (color, index) {
    var cellPosition = getCellPositionFromIndex(index, columns, cellSize);

    if (defaults.withTransparency && color === 'transparent') {
      clearCell(context, defaults.x + cellPosition.x, defaults.y + cellPosition.y, cellSize);
    } else {
      drawCell(context, defaults.x + cellPosition.x, defaults.y + cellPosition.y, cellSize, color);
    }
  });
}

function makeMap (cellColor, cellCount, options) {
  defaults = {};

  _.extend(defaults, options);

  var map = [];
  _.times(cellCount, function (index) {
    if (defaults.positions && defaults.positions.indexOf(index) > -1) {
      map.push(defaults.color);
    } else {
      map.push(cellColor);
    }
  });
  return map;
}

function getCellAboveThisIndex (index, columns) {
  if (index <= columns) {
    return null;
  }
  return index - columns;
}

function getCellAboveThisIndex (index, columns) {
  if (typeof(index) === 'undefined' || typeof(columns) === 'undefined') {
    throw('Requires index and columns');
  }

  if (index <= columns) {
    return null;
  }
  return index - columns;
}

function getCellBelowThisIndex (index, rows, columns) {
  if (typeof(index) === 'undefined' || typeof(rows) === 'undefined' || typeof(columns) === 'undefined') {
    throw('Requires index and rows and columns');
  }

  if (index >= (rows * columns) - columns) {
    return null;
  }
  return index + columns;
}



// drawable surface setup (i.e. the main canvas and the constructor canvas)

function DrawableSurface ($element, cellSize, defaultCellColor, firstLayer, secondLayer) {
  var self = this;
  self.$element = $element;
  self.cellSize = cellSize || defaultCellSize;
  self.columns = self.$element.width() / self.cellSize;
  self.rows = self.$element.height() / self.cellSize;
  self.selectedStyle = {style: '#000'};
  self.defaultCellColor = defaultCellColor || '#fff';
  self.map = firstLayer || self.makeMap(self.defaultCellColor); //background, also potentially animated
  self.animatedMap = secondLayer || self.makeMap(null); // foreground
  self.selectedBlocksMap = [];
  self.stopAnimation = false;
  self.drawOnBackground = true;

  // setup
  self.makeDrawable();
}

DrawableSurface.prototype.clear = function () {
  this.$element[0].getContext('2d').clearRect(0,0,this.$element.width(),this.$element.height());
};

DrawableSurface.prototype.startAnimating = function () {
  var self = this;
  var fps = 3;
  self.stopAnimation = false;

  function draw () {
    if (!self.stopAnimation) {
      setTimeout(function() {
        requestAnimationFrame (draw);

        self.clear();
        self.renderFirstMap();
        self.renderSecondMap();
        self.renderSelectedBlocksMap();
      }, 1000 / fps);
    }
  }

  draw();
};

DrawableSurface.prototype.pauseAnimating = function () {
  this.stopAnimation = true;
};

DrawableSurface.prototype.makeMap = function (cellColor) {
  var map = [];
  _.times(this.columns * this.rows, function () {
    map.push(cellColor);
  });
  return map;
};

DrawableSurface.prototype.setupSelectedBlock = function (position) {
  var self = this;

  self.selectedBlock = {
    position: position,
    value: self.drawOnBackground ? self.map[position] : self.animatedMap[position],
    map: self.drawOnBackground ? self.map : self.animatedMap,
    onBackground: self.drawOnBackground
  };
};

DrawableSurface.prototype.makeDrawable = function () {
  var self = this;

  function selectIt (event) {
    $deleteFromMainCanvasButton.css('display', 'inline-block').show();
    $editInMainCanvasButton.css('display', 'inline-block').show();
    $editorAreaContainer.hide();

    var offX  = (event.offsetX || event.clientX - $(event.target).offset().left + window.pageXOffset);
    var offY  = (event.offsetY || event.clientY - $(event.target).offset().top + window.pageYOffset);

    var positionInArray = getCellPositionInArrayFromPosition(offX, offY, self.cellSize, self.columns);
    self.selectedBlocksMap = makeMap(null, self.columns * self.rows, {color: colors[3], positions: [positionInArray]});

    self.setupSelectedBlock(positionInArray);
  }

  function drawIt (event) {
    var offX  = (event.offsetX || event.clientX - $(event.target).offset().left + window.pageXOffset);
    var offY  = (event.offsetY || event.clientY - $(event.target).offset().top + window.pageYOffset);

    var cellPosition = getCellPosition(offX, offY, self.cellSize);
    var positionInArray = getCellPositionInArrayFromPosition(offX, offY, self.cellSize, self.columns);

    var drawingContext = self.$element[0].getContext('2d');
    clearCell(drawingContext, cellPosition.x, cellPosition.y, self.cellSize);

    if (typeof(self.selectedStyle.style) === 'string') {
      if (self.selectedStyle.style !== 'transparent') {
        drawCell(self.$element[0].getContext('2d'), cellPosition.x, cellPosition.y, self.cellSize, self.selectedStyle.style);
      }

      if (self.drawOnBackground) {
        self.map[positionInArray] = self.selectedStyle.style;
      } else {
        self.animatedMap[positionInArray] = self.selectedStyle.style;
      }
    } else if (typeof(self.selectedStyle.style) === 'object' && self.selectedStyle.style.layers) {
      if (self.drawOnBackground) {
        self.map[positionInArray] = new AnimatedBlock(_.cloneDeep(self.selectedStyle.style.layers));
      } else {
        self.animatedMap[positionInArray] = new AnimatedBlock(_.cloneDeep(self.selectedStyle.style.layers));
      }

      _.each(self.map, function (block) {
        if (block && typeof(block) === 'object' && block.layers) {
          block.resetIndex();
        }
      });

      _.each(self.animatedMap, function (block) {
        if (block && typeof(block) === 'object' && block.layers) {
          block.resetIndex();
        }
      });
    }

    $.publish("updated-map", {
      surface: self,
      index: positionInArray,
      value: self.selectedStyle.style,
      valueInfo: self.selectedStyle.info
    });

  }

  self.$element.on('mousedown', function (event) {
    if (!selectActive || self === editorArea.selectedDrawableSurface()) {
      drawIt(event);
    } else {
      selectIt(event);
    }
  });

  self.$element.on('mousemove', function (event) {
    if ((mouseIsDown && !selectActive) || mouseIsDown && self === editorArea.selectedDrawableSurface()) {
      drawIt(event);
    }
  });
};

DrawableSurface.prototype.renderMap = function (map) {
  var self = this;
  var context = self.$element[0].getContext('2d');

  _.each(map, function (block, index, list) {
    if (block) {
      var position = getCellPositionFromIndex(index, self.columns);

      if (typeof(block) === 'object' && block.layers) {
        if (block.prerenderedLayers.length) {
          var prerenderedLayer = block.prerenderedLayers[block.nextLayerNum()];
          context.drawImage(prerenderedLayer, position.x, position.y);
        }
      } else {
        drawCell(context, position.x, position.y, defaultCellSize, block);
      }

    }
  });
};

DrawableSurface.prototype.renderSelectedBlocksMap = function (map) {
  var self = this;
  var context = self.$element[0].getContext('2d');

  _.each(self.selectedBlocksMap, function (block, index) {
    if (block) {
      var position = getCellPositionFromIndex(index, self.columns);

      drawOutline(context, position.x, position.y, defaultCellSize, block);
    }
  });
};

DrawableSurface.prototype.renderFirstMap = function () {
  this.renderMap(this.map);
};

DrawableSurface.prototype.renderSecondMap = function () {
  this.renderMap(this.animatedMap);
};


var editorArea = {
  animatedBlock: null,
  drawableSurfaces: [],
  selectedLayerNum: 0,
  selectedStyle: {
    style: '#000'
  },
  $layersContainerElement: $('.layers'),
  makeNewAnimatedBlock: function (layers, options) {
    var self = this;

    this.animatedBlock.pauseAnimation();
    this.animatedBlock.removeAllLayers();
    this.animatedBlock = new AnimatedBlock([], options);

    if (layers) {
      self.animatedBlock.addLayers(layers);
    } else {
      this.animatedBlock.addLayer('transparent');
    }

    this.animatedBlock.$animatedElement = $('#preview-container').children('canvas.block');
    this.animatedBlock.startAnimation();

    if (this.animatedBlock.fromMainCanvas) {
      $exportBlockButton.show();
    } else {
      $exportBlockButton.hide();
    }

    return this.animatedBlock;
  },
  setSelectedLayer: function (num) {
    if (num > this.drawableSurfaces.length - 1) {
      throw 'Can\'t set selcted layer cuz it\'s not there';
    } else {
      this.selectedLayerNum = num;

      var surfaceCount = this.drawableSurfaces.length;
      _.each(this.drawableSurfaces, function (surface, index) {
        if (index === num) {
          surface.$element.css('z-index', 100 + surfaceCount + num);
        } else if (index < num) {
          surface.$element.css('z-index', 100 + surfaceCount + index);
        } else if (index > num) {
          surface.$element.css('z-index', 100 + surfaceCount - index - (surfaceCount - index));
        }
      });

      var $drawableLayers = $('#constructor-area-container .constructor-area').css('opacity', 0.5);
      var $selectedDrawableLayer = $('#constructor-area-container .constructor-area').eq(this.selectedLayerNum).css('opacity', 1);

      var $selectedLayer = $('.layers .layer-container').removeClass('selected').eq(this.selectedLayerNum).addClass('selected');

      $.publish('selected-layer', {
        layerNum: num,
        layer: $selectedLayer
      });
    }
  },
  setSelectedStyle: function (style, info) {
    var self = this;

    this.selectedStyle.style = style;

    if (info) {
      this.selectedStyle.info = info;
    } else {
      this.selectedStyle.info = null;
    }

    _.each(this.drawableSurfaces, function (surface) {
      surface.selectedStyle.style = style;

      if (self.selectedStyle.info) {
        surface.selectedStyle.info = self.selectedStyle.info;
      } else {
        surface.selectedStyle.info = null;
      }
    });
  },
  refreshSelectedStyle: function () {
    var self = this;

    _.each(this.drawableSurfaces, function (surface) {
      surface.selectedStyle.style = self.selectedStyle.style;

      if (self.selectedStyle.info) {
        surface.selectedStyle.info = self.selectedStyle.info;
      } else {
        surface.selectedStyle.info = null;
      }
    });
  },
  selectedDrawableSurface: function () {
    return this.drawableSurfaces[this.selectedLayerNum];
  },
  renderSelectedLayer: function () {
    // renders the selected layer based on the selected layer in the attached animated block
    var selectedLayer = this.animatedBlock.layers[this.selectedLayerNum];

    if (selectedLayer && this.selectedDrawableSurface()) {
      var drawableSurface = this.selectedDrawableSurface(),
        drawableContext = drawableSurface.$element[0].getContext('2d');

      // this might be a little redundant. need to decide whether to update the layer by drawing on it directly or by updating a map, not both
      drawableSurface.map = selectedLayer;
      applyMapToContext(selectedLayer, drawableContext, drawableSurface.cellSize, drawableSurface.columns);
    }

    // this renders the thumbnail of the selected layer
    if (this.selectedLayerNum >= 0) {
      var smallLayer = $('.layers .layer-container .block')[this.selectedLayerNum];
      var columns = smallLayer.width / defaultTinyCellSize;
      applyMapToContext(selectedLayer, smallLayer.getContext('2d'), defaultTinyCellSize, columns, {withTransparency: true});
    }
  },
  addLayer: function (layerPattern, layerNum) {
    var self = this;

    // layer menu setup
    var $layerElement = makeNewBlock();
    var $layerContainer = makeNewElement();
    var $arrowElement = $('<div class="arrow"><img src="/img/arrow.png" /></div>');
    $layerContainer.addClass('block area-container layer-container selected');
    $layerContainer.append($layerElement.add($arrowElement));

    var layers = this.$layersContainerElement.children('.layer-container');
    if (layers.length && typeof(layerNum) === 'number') {
      // add it to the one after the selected layer
      layers.eq(layerNum - 1).after($layerContainer);
    } else {
      // add it to the end
      this.$layersContainerElement.append($layerContainer);
    }

    // adds event listener to layers in layer menu
    $layerContainer.on('click', function (event) {
      $clickedElement = $(event.currentTarget);

      var layerNum = $('.layers .layer-container').index($clickedElement);
      self.setSelectedLayer(layerNum);
      self.renderSelectedLayer();
    });

    // applies pattern to layer in layer menu
    var context = $layerElement[0].getContext('2d');
    var columns = $layerElement.width() / defaultTinyCellSize;
    applyMapToContext(layerPattern, context, defaultTinyCellSize, columns);

    var $constructorArea = $('<canvas></canvas>')
                              .addClass('constructor-area')
                              .attr('width', 600)
                              .attr('height', 600);

    var constructorAreas = $('#constructor-area-container .constructor-area');
    if (constructorAreas.length && typeof(layerNum) === 'number') {
      // add it to the one after the selected layer
      constructorAreas.eq(layerNum - 1).after($constructorArea);
    } else {
      // add it to the end
      $constructorArea.appendTo('#constructor-area-container');
    }

    var surface = new DrawableSurface($constructorArea, defaultEditCellSize);
    this.drawableSurfaces.splice(layerNum, 0, surface);
    self.setSelectedLayer(layerNum);

    // renders editor area canvas and selected layer in layers menu
    self.renderSelectedLayer();

    self.refreshSelectedStyle();
  },
  removeLayer: function (layerNum) {
    var self = this;

    // don't use this directly, remove from the animatedBlock instead
    $('#constructor-area-container .constructor-area').eq(layerNum).remove();
    $('.layers .layer-container').eq(layerNum).remove();
    self.drawableSurfaces.splice(layerNum, 1);

    if (self.drawableSurfaces.length) {
      if (self.selectedLayerNum === 0) {
        self.setSelectedLayer(self.selectedLayerNum);
      } else {
        self.setSelectedLayer(self.selectedLayerNum - 1);
      }

      self.renderSelectedLayer();
    }
  },
  setup: function (layers) {
    var self = this;

    self.animatedBlock = new AnimatedBlock(layers || []);

    $.subscribe('added-layer', function (event, addedLayerUpdate) {
      if (self.animatedBlock == addedLayerUpdate.animatedBlock) {
        self.addLayer(addedLayerUpdate.layer, addedLayerUpdate.layerNum);
      }
    });

    $.subscribe('removed-layer', function (event, layerNum) {
      self.removeLayer(layerNum);
      self.animatedBlock.resetIndex();
    });

    // this comes from drawing on an editor area
    $.subscribe('updated-map', function (event, update) {
      if (update.surface === editorArea.selectedDrawableSurface()) {
        self.animatedBlock.changeLayerValue(self.selectedLayerNum, update.index, update.value);
        // updates the thumbnail of the selected layer (and the selected layer itself) based on the selected layer of the attached animated block
        self.renderSelectedLayer();
      }
    });

    $('#delete-layer').on('click', function (event) {
      event.preventDefault();
      self.animatedBlock.removeLayer(self.selectedLayerNum);
      if (self.animatedBlock.layers.length === 0) {
        self.animatedBlock.addLayer('transparent');
        self.setSelectedLayer(0);
      }
      self.animatedBlock.clearAnimation();
    });

    $('#new-layer').on('click', function (event) {
      event.preventDefault();

      var colorOfNewLayer = self.animatedBlock.fromMainCanvas && self.animatedBlock.mainCanvasOnBackground ? '#fff' : 'transparent';
      self.animatedBlock.addLayer(colorOfNewLayer, self.selectedLayerNum + 1);
    });

    $('#copy-layer').on('click', function (event) {
      event.preventDefault();
      self.animatedBlock.addLayer(_.cloneDeep(self.animatedBlock.layers[self.selectedLayerNum]), self.selectedLayerNum + 1);
    });

  }
};

// set up main canvas

var mainArea = {
  drawableSurfaces: [],
  selectedStyle: {
    style: '#000',
  },
  setSelectedStyle: function (style, info) {
    this.selectedStyle.style = style;
    this.drawableSurfaces[0].selectedStyle.style = style;

    if (info) {
      this.selectedStyle.info = info;
      this.drawableSurfaces[0].selectedStyle.info = info;
    } else {
      this.selectedStyle.info = null;
      this.drawableSurfaces[0].selectedStyle.info = null;
    }

    $.publish('selected-style', {
      surface: this,
      style: {
        style: style,
        info: info
      }
    });
  },
  refreshSelectedStyle: function () {
    var self = this;

    _.each(this.drawableSurfaces, function (surface) {
      surface.selectedStyle.style = self.selectedStyle.style;

      if (self.selectedStyle.info) {
        surface.selectedStyle.info = self.selectedStyle.info;
      } else {
        surface.selectedStyle.info = null;
      }
    });
  },
  selectedDrawableSurface: function () {
    return this.drawableSurfaces[0];
  },
  setup: function (firstLayer, secondLayer) {
    this.drawableSurfaces.push(new DrawableSurface($('#main-area'), defaultCellSize, '#fff', firstLayer, secondLayer));
    this.selectedDrawableSurface().startAnimating();
  }
};

// parent is an area, either mainArea or editorArea
function ColorPalette (map, $container, parent, size) {
  var self = this;
  self.map = [];
  self.$containerElement = $container;
  self.paletteElements = [];
  self.parent = parent;
  self.cellSize = size || defaultCellSize;

  _.each(map, function (value) {
    self.addStyle(value);
  });
}

ColorPalette.prototype.generatePaletteElement = function (value) {
  var $paletteElementContainer = makeNewElement();
  $paletteElementContainer.addClass('palette-element-container');

  if (typeof(value) === 'object' && value.layers) {
    var animatedBlock = value;

    var $animatedElement = makeNewBlock(this.cellSize);
    $animatedElement.addClass('animated');

    animatedBlock.$animatedElement = $animatedElement;
    animatedBlock.startAnimation();

    $paletteElementContainer.append($animatedElement);
    $paletteElementContainer.data('paletteValue', {type: 'animated', value: animatedBlock});
    $paletteElementContainer.addClass('animated-block');
  } else if (typeof(value) === 'string') {
    var color = value;

    var $colorElement = makeNewElement();
    $colorElement.addClass("color block");
    $colorElement.css('background-color', color);

    $paletteElementContainer.append($colorElement);
    $paletteElementContainer.data('paletteValue', {type: 'color', value: color});
    $paletteElementContainer.addClass('solid-color');
  }

  this.paletteElements.push($paletteElementContainer);
  return $paletteElementContainer;
};

ColorPalette.prototype.addPaletteElement = function ($element) {
  this.$containerElement.append($element);

  _.each(this.paletteElements, function ($element) {
    $element.removeClass('selected');
  });
  $element.addClass('selected');

  this.parent.setSelectedStyle($element.data('paletteValue').value);

  this.addEventListeners($element);

};

ColorPalette.prototype.addMapValue = function (value) {
  this.map.push(value);
};

ColorPalette.prototype.getBlockWithId = function (id) {
  if (!id) return null;

  var matchingBlock = null;
  _.each(this.map, function (block, index) {
    if (block.uniqueId === id) {
      matchingBlock = {
        matchingBlock: block,
        index: index
      };
      return false;
    }
  });

  return matchingBlock;
};

// pass in a new AnimatedBlock or a color as a string
ColorPalette.prototype.addStyle = function (value) {
  var paletteElement;

  this.addMapValue(value);
  paletteElement = this.generatePaletteElement(value);

  this.addPaletteElement(paletteElement);
};

ColorPalette.prototype.saveCustomBlock = function (layers, id) {
  var matchingBlock = this.getBlockWithId(id);
  if (matchingBlock) {
    matchingBlock.matchingBlock.layers = layers;
    matchingBlock.matchingBlock.regeneratePrerenderedLayers();
  }
};

ColorPalette.prototype.addEventListeners = function ($paletteElement) {
  // this should unbind the previous event listeners before attaching new ones
  // or find time to bind this: do it when palette items are added instead of looping over all of them every time
  var self = this;

  $paletteElement.on('click', function (event) {
    var $clickedElement = $(event.currentTarget);

    $clickedElement.siblings('.palette-element-container.selected').removeClass('selected');
    $clickedElement.addClass('selected');

    self.parent.setSelectedStyle($clickedElement.data('paletteValue').value, $clickedElement.data('paletteInfo'));
  });
};

$.subscribe('selected-style', function (event, update) {
  var buttons = $('#copy-block, #delete-block');
  var $editorAreaElement = $('#constructor-container');
  if (typeof(update.style) === 'object' && !(update.style.style && update.style.style.layers)) {
    buttons.hide();
    $editorAreaElement.hide();
  } else {
    buttons.css('display', 'inline-block');
    buttons.show();

    $editorAreaElement.show();
    editorArea.makeNewAnimatedBlock(_.cloneDeep(update.style.style.layers), {uniqueId: update.style.style.uniqueId});
  }

  disableMainCanvasSelect();
});

//!!!
$('#new-block').on('click', function (event) {
  event.preventDefault();
  $('#constructor-container').show();
  editorArea.makeNewAnimatedBlock();
  mainColorPalette.addStyle(new AnimatedBlock(_.cloneDeep(editorArea.animatedBlock.layers), {uniqueId: editorArea.animatedBlock.uniqueId}));
});

// Auto-update logic: debounced update when editor changes
var autoUpdateTimeout;
function scheduleAutoUpdate() {
  clearTimeout(autoUpdateTimeout);
  autoUpdateTimeout = setTimeout(function() {
    performBlockUpdate();
  }, 300);
}

function performBlockUpdate() {
  var animBlock = editorArea.animatedBlock;
  if (!animBlock) return;

  if (animBlock.fromMainCanvas) {
    // update the animated block at the saved position with the new layers
    if (animBlock.mainCanvasOnBackground) {
      if (mainArea.selectedDrawableSurface().map[animBlock.mainCanvasPosition]) {
        mainArea.selectedDrawableSurface().map[animBlock.mainCanvasPosition].layers = _.cloneDeep(animBlock.layers);
        mainArea.selectedDrawableSurface().map[animBlock.mainCanvasPosition].regeneratePrerenderedLayers();
      }
    } else {
      if (mainArea.selectedDrawableSurface().animatedMap[animBlock.mainCanvasPosition]) {
        mainArea.selectedDrawableSurface().animatedMap[animBlock.mainCanvasPosition].layers = _.cloneDeep(animBlock.layers);
        mainArea.selectedDrawableSurface().animatedMap[animBlock.mainCanvasPosition].regeneratePrerenderedLayers();
      }
    }

    // reset animation indices
    _.each(mainArea.selectedDrawableSurface().map, function (block) {
      if (block && typeof(block) === 'object' && block.layers) {
        block.resetIndex();
      }
    });
    _.each(mainArea.selectedDrawableSurface().animatedMap, function (block) {
      if (block && typeof(block) === 'object' && block.layers) {
        block.resetIndex();
      }
    });
  } else if (animBlock.uniqueId && mainColorPalette) {
    mainColorPalette.saveCustomBlock(_.cloneDeep(animBlock.layers), animBlock.uniqueId);

    // reset animations to line up
    _.each(mainColorPalette.map, function (block) {
      if (block && block.layers) {
        block.resetIndex();
      }
    });
  }

  // Schedule auto-save after block updates
  if (typeof scheduleAutoSave === 'function') {
    scheduleAutoSave();
  }
}

// Subscribe to editor updates for auto-save
$.subscribe('updated-map', function (event, update) {
  if (update.surface === editorArea.selectedDrawableSurface()) {
    scheduleAutoUpdate();
  }
});

$.subscribe('added-layer', function () {
  scheduleAutoUpdate();
});

$.subscribe('removed-layer', function () {
  scheduleAutoUpdate();
});

$('#save-block').on('click', function (event) {
  event.preventDefault();

  var animBlock = editorArea.animatedBlock;

  if (animBlock.fromMainCanvas) {
    // update the animated block at the saved position with the new layers
    if (animBlock.mainCanvasOnBackground) {
      mainArea.selectedDrawableSurface().map[animBlock.mainCanvasPosition].layers = _.cloneDeep(animBlock.layers);
      mainArea.selectedDrawableSurface().map[animBlock.mainCanvasPosition].regeneratePrerenderedLayers();
    } else {
      mainArea.selectedDrawableSurface().animatedMap[animBlock.mainCanvasPosition].layers = _.cloneDeep(animBlock.layers);
      mainArea.selectedDrawableSurface().animatedMap[animBlock.mainCanvasPosition].regeneratePrerenderedLayers();
    }

    // reset the index of all animated blocks on fg and bg layer
    _.each(mainArea.selectedDrawableSurface().map, function (block) {
      if (block && typeof(block) === 'object' && block.layers) {
        block.resetIndex();
      }
    });
    _.each(mainArea.selectedDrawableSurface().animatedMap, function (block) {
      if (block && typeof(block) === 'object' && block.layers) {
        block.resetIndex();
      }
    });
  } else {
    mainColorPalette.saveCustomBlock(_.cloneDeep(animBlock.layers), animBlock.uniqueId);

    //this is for making their animations line up 
    _.each(mainColorPalette.map, function (block) {
      if (block.layers) {
        block.resetIndex();
      }
    });
  }
});

$('#copy-block').on('click', function (event) {
  event.preventDefault();

  var newAnimatedBlock = editorArea.makeNewAnimatedBlock(_.cloneDeep(mainArea.selectedDrawableSurface().selectedStyle.style.layers));
  mainColorPalette.addStyle(new AnimatedBlock(_.cloneDeep(mainArea.selectedDrawableSurface().selectedStyle.style.layers), {uniqueId: newAnimatedBlock.uniqueId}));
});

$('#delete-block').on('click', function (event) {
  event.preventDefault();
  var selectedAnimatedBlock = mainColorPalette.parent.selectedStyle.style;
  // weird
  var index = mainColorPalette.map.indexOf(selectedAnimatedBlock);

  mainColorPalette.map.splice(index, 1);
  mainColorPalette.parent.setSelectedStyle(mainColorPalette.map[index - 1]);

  selectedAnimatedBlock.$animatedElement.parent().remove();

  mainColorPalette.paletteElements.splice(index, 1);
  mainColorPalette.paletteElements[index - 1].addClass('selected');
});


var applyShadow = function () {
  $('.constructor-area').css('opacity', '.25').eq(editorArea.selectedLayerNum).css('opacity', '.5');
};

var removeShadow = function () {
  $('.constructor-area').css('opacity', '.5').eq(editorArea.selectedLayerNum).css('opacity', '1');
};

var shadowEnabled = false;
$('#enable-shadow').on('click', function () {
  if (this.checked) {
    shadowEnabled = true;
    applyShadow();
  } else {
    shadowEnabled = false;
    removeShadow();
  }
});

$.subscribe('selected-layer', function(event, update) {
  if (shadowEnabled) {
    applyShadow();
  }
});


$('#bg-fg-switch').on('click', function (event) {
  event.preventDefault();
  var button = $(event.currentTarget);
  var $noticeText = $('#bg-fg-switch-text');

  if (mainArea.selectedDrawableSurface().drawOnBackground) {
    button.text('Edit Background');
    $noticeText.text('Editing Foreground Layer');
    mainArea.selectedDrawableSurface().drawOnBackground = false;

    $editorAreaContainer.hide();

    // reset selected block
    if (mainArea.selectedDrawableSurface().selectedBlock) {
      mainArea.selectedDrawableSurface().setupSelectedBlock(mainArea.selectedDrawableSurface().selectedBlock.position);
    }
  } else {
    button.text('Edit Foreground');
    $noticeText.text('Editing Background Layer');
    mainArea.selectedDrawableSurface().drawOnBackground = true;

    $editorAreaContainer.hide();

    // reset selected block
    if (mainArea.selectedDrawableSurface().selectedBlock) {
      mainArea.selectedDrawableSurface().setupSelectedBlock(mainArea.selectedDrawableSurface().selectedBlock.position);
    }
  }
});

// Canvas layer panel - Photoshop-style layer switching
var currentCanvasLayer = 'foreground';

function updatePaletteVisibility() {
  var $palette = $('#main-color-palette');
  if (currentCanvasLayer === 'foreground') {
    $palette.find('.solid-color').hide();
    $palette.find('.animated-block').show();
  } else {
    $palette.find('.solid-color').show();
    $palette.find('.animated-block').hide();
  }
}

function selectCanvasLayer(layer) {
  currentCanvasLayer = layer;

  $('.canvas-layers-panel .layer-item').removeClass('selected');
  $('.canvas-layers-panel .layer-item[data-layer="' + layer + '"]').addClass('selected');

  if (layer === 'foreground') {
    mainArea.selectedDrawableSurface().drawOnBackground = false;
  } else {
    mainArea.selectedDrawableSurface().drawOnBackground = true;
  }

  updatePaletteVisibility();

  // reset selected block
  if (mainArea.selectedDrawableSurface().selectedBlock) {
    mainArea.selectedDrawableSurface().setupSelectedBlock(mainArea.selectedDrawableSurface().selectedBlock.position);
  }
}

$('.canvas-layers-panel .layer-item').on('click', function(event) {
  event.preventDefault();
  var layer = $(this).data('layer');
  selectCanvasLayer(layer);
});

var paletteElementThatWasSelected;
var selectActive = false;

function disableMainCanvasSelect () {
  selectActive = false;
  $('#select-block-from-main-canvas').removeClass('active');
  mainArea.selectedDrawableSurface().selectedBlocksMap = [];

  $deleteFromMainCanvasButton.hide();
  $editInMainCanvasButton.hide();
}

$('#select-block-from-main-canvas').on('click', function (event) {
  event.preventDefault();
  $button = $('#select-block-from-main-canvas');

  if ($button.hasClass('active')) {
    disableMainCanvasSelect();

    paletteElementThatWasSelected.addClass('selected');
    $editorAreaContainer.show();
  } else {
    selectActive = true;
    $button.addClass('active');

    paletteElementThatWasSelected = $('#main-color-palette .palette-element-container.selected').removeClass('selected');
    $editorAreaContainer.hide();
  }
});

$editInMainCanvasButton.on('click', function (event) {
  event.preventDefault();

  $editorAreaContainer.show();

  var selectedBlock = mainArea.selectedDrawableSurface().selectedBlock;
  var animatedBlock;

  if (typeof(selectedBlock.value) === 'string' || selectedBlock.value === null) {
    animatedBlock = editorArea.makeNewAnimatedBlock([selectedBlock.value === null ? 'transparent' : selectedBlock.value], {
      fromMainCanvas: true,
      mainCanvasPosition: selectedBlock.position,
      mainCanvasOnBackground: selectedBlock.onBackground
    });

    selectedBlock.map[selectedBlock.position] = new AnimatedBlock([selectedBlock.value === null ? 'transparent' : selectedBlock.value], {
      uniqueId: animatedBlock.uniqueId
    });

    // reset selected block
    mainArea.selectedDrawableSurface().setupSelectedBlock(selectedBlock.position);

  } else if (typeof(selectedBlock.value) === 'object' && selectedBlock.value.layers) {
    editorArea.makeNewAnimatedBlock(_.cloneDeep(selectedBlock.value.layers), {
      uniqueId: selectedBlock.value.uniqueId,
      fromMainCanvas: true,
      mainCanvasPosition: selectedBlock.position,
      mainCanvasOnBackground: selectedBlock.onBackground
    });
  }
});


$exportBlockButton.on('click', function (event) {
  event.preventDefault();

  if (mainColorPalette.getBlockWithId(editorArea.animatedBlock.uniqueId)) {
    mainColorPalette.saveCustomBlock(_.cloneDeep(editorArea.animatedBlock.layers), editorArea.animatedBlock.uniqueId);
  } else {
    mainColorPalette.addStyle(new AnimatedBlock(_.cloneDeep(editorArea.animatedBlock.layers), {
      uniqueId: editorArea.animatedBlock.uniqueId
    }));
  }

  //this is for making their animations line up 
  _.each(mainColorPalette.map, function (block) {
    if (block.layers) {
      block.resetIndex();
    }
  });
});

$deleteFromMainCanvasButton.on('click', function (event) {
  event.preventDefault();

  $editorAreaContainer.hide();

  var selectedBlock = mainArea.selectedDrawableSurface().selectedBlock;
  selectedBlock.map[selectedBlock.position] = selectedBlock.onBackground ? '#fff' : null;

  // reset selected block
  mainArea.selectedDrawableSurface().setupSelectedBlock(mainArea.selectedDrawableSurface().selectedBlock.position);
});

$('#save').on('click', function (event) {
  event.preventDefault();
  var $clickedButton = $(event.currentTarget);

  if ($clickedButton.text() === 'Save') {
    saveData(function () {
      $clickedButton.text('Saved!').css('color', '#adf2b1');
      setTimeout(function() {
        $clickedButton.text('Save').css('color', '#fff');
      }, 3000);
    });
  }
});


backgrounds = [];
function addNewBackground (name, author, nameUrl, authorUrl, textColor, textShadow, imageUrl, logoUrl) {
  var newBackground = {
    name: name,
    author: author,
    nameUrl: nameUrl,
    authorUrl: authorUrl,
    textColor: textColor,
    textShadow: textShadow,
    imageUrl: imageUrl,
    logoUrl: logoUrl
  };

  backgrounds.push(newBackground);
}

addNewBackground('Tree Bark', '', 'http://subtlepatterns.com/tree-bark/', '', '#222', '#fff', '/img/backgrounds/tree_bark.png', '/img/logos/journeyship-logo.png');
addNewBackground('Wild Olivia', 'Badhon Ebrahim', 'http://subtlepatterns.com/wild-oliva/', 'http://dribbble.com/graphcoder', '#fff', '#333', '/img/backgrounds/wild_oliva.png', '/img/logos/journeyship-logo.png');
addNewBackground('Shattered', 'Luuk van Baars', 'http://subtlepatterns.com/shattered/', 'http://luukvanbaars.com/', '#222', '#fff', '/img/backgrounds/shattered.png', '/img/logos/journeyship-logo.png');
addNewBackground('Tweed', 'Simon Leo', 'http://subtlepatterns.com/tweed/', '#', '#fff', '#333', '/img/backgrounds/tweed.png', '/img/logos/journeyship-logo.png');
addNewBackground('DinPattern Blueprint', 'Evan Eckard', 'http://www.dinpattern.com/2011/05/31/blueprint/', 'http://www.evaneckard.com/', '#222', '#fff', '/img/backgrounds/blueprint.gif', '/img/logos/journeyship-logo.png');
addNewBackground('Party Lights', 'Patrick Hoesly', 'http://www.flickr.com/photos/zooboing/4425770337/', 'http://www.flickr.com/photos/zooboing/', '#fff', '#333', '/img/backgrounds/party-lights.jpg', '/img/logos/journeyship-logo.png');
addNewBackground('DinPattern Stripe', 'Evan Eckard', 'http://www.dinpattern.com/2009/04/07/dinpattern-stripe/', 'http://www.evaneckard.com/', '#fff', '#333', '/img/backgrounds/stripe.gif', '/img/logos/journeyship-logo.png');
addNewBackground('pattern with waves', 'il67', 'http://www.shutterstock.com/pic.mhtml?id=70950994', 'http://www.shutterstock.com/gallery-196705p1.html', '#222', '#fff', '/img/backgrounds/waves.jpg', '/img/logos/journeyship-logo.png');
//addNewBackground('Peonies', 'yncolor', 'http://www.colourlovers.com/pattern/3822042/Peonies', 'http://www.colourlovers.com/lover/yncolor/', '#222', '#fff', '/img/backgrounds/peonies.png', '/img/logos/journeyship-logo.png');
//addNewBackground('Alien and monsters', 'trendywest', 'http://www.shutterstock.com/pic.mhtml?id=74496550', 'http://www.shutterstock.com/gallery-73363p1.html', '#222', '#fff', '/img/backgrounds/monsters.jpg', '/img/logos/journeyship-logo-black.png');
//addNewBackground('people\'s faces','Chief Crow Daria','http://www.shutterstock.com/pic.mhtml?id=84098341','http://www.shutterstock.com/gallery-224326p1.html', '#222', '#fff', '/img/backgrounds/people.jpg', '/img/logos/journeyship-logo-white.png');
//addNewBackground('space, rockets, and stars', 'TashaNatasha','http://www.shutterstock.com/pic.mhtml?id=138028943','http://www.shutterstock.com/gallery-1013693p1.html', '#222', '#fff', '/img/backgrounds/spaceships.jpg', '/img/logos/journeyship-logo-blue.png');
//addNewBackground('hand-drawn waves', 'Markovka', 'http://www.shutterstock.com/pic.mhtml?id=96193649', 'http://www.shutterstock.com/gallery-495859p1.html', '#fff', '/img/backgrounds/hand-drawn-waves.jpg', '/img/logos/journeyship-logo-purple.png');
//addNewBackground('DinPattern Transmit', 'Evan Eckard', 'http://www.dinpattern.com/2010/07/06/transmit/', 'http://www.evaneckard.com/', '/img/backgrounds/transmit.gif');

_.each(backgrounds, function(bg) {
  $('<div></div>')
    .addClass('background-item')
    .css('background-image', 'url(' + bg.imageUrl + ')')
    .data('bgInfo', bg)
    .appendTo('.top-backgrounds-container');
});

function selectThisBackground (bg) {
  $('body').css('background-image', 'url(' + bg.imageUrl + ')');
  $('.page-heading').css('background-image', 'url(' + bg.logoUrl + ')');

  $bgInfo = $('.background-image-info');
  $bgInfo
    .children('.background-image-name')
    .text(bg.name)
    .attr('href', bg.nameUrl);

  if (bg.author) {
    $bgInfo.find('.background-image-artist-wrapper').show();
    $bgInfo.find('.background-image-artist')
      .text(bg.author)
      .attr('href', bg.authorUrl);
  } else {
    $bgInfo.find('.background-image-artist-wrapper').hide();
  }

  selectedBackgroundImage = bg;
}

$('.background-item').on('click', function (event) {
  event.preventDefault();
  var $clickedItem = $(event.currentTarget);

  selectThisBackground($clickedItem.data('bgInfo'));
});


var version;
var colors;
var mainColorPalette;
var editorAreaColorPalette;
var spinnerOpts = {
  radius: 60,
  length: 50,
  color: '#fff'
};

var loadData = function (data) {
  var $target = $('#load');
  $target.css('display', 'block');
  var spinner = new Spinner(spinnerOpts).spin($target.get(0));

  $.when(replaceLayersWithAnimatedBlocks(data.main.palette), replaceLayersWithAnimatedBlocks(data.main.firstLayer), replaceLayersWithAnimatedBlocks(data.main.secondLayer)).then(function () {
    spinner.stop();
    $target.remove();

    mainArea.setup(data.main.firstLayer, data.main.secondLayer);
    mainColorPalette = new ColorPalette (data.main.palette, $('#main-color-palette'), mainArea);
  });

  editorArea.setup(data.editor.animatedBlock.layers);
  editorAreaColorPalette = new ColorPalette (colors, $('#constructor-color-palette'), editorArea, defaultEditCellSize);

  selectThisBackground(data.options.selectedBackground);

  // Default to foreground layer and update palette visibility
  setTimeout(function() {
    selectCanvasLayer('foreground');
  }, 100);

  return data;
};

var load = function () {

  // Match alphanumeric story ID (nanoid format)
  var paths = window.location.pathname.match(/\/([A-Za-z0-9]+)\/?(\d+)?/);

  if (paths) {

    var version = paths[2] || 0;

    $.ajax({
      url: '/getstory/',
      data: {
        _id: paths[1] + '-' + version
      },
      success: function (result) {
        version = result.version;

        loadData(JSON.parse(result.data));
      },
      error: function (error) {
        // do something here
      }
    });
  } else {
    editorArea.setup();
    mainArea.setup();

    var contentBlocks = [];
    contentBlocks.push(new AnimatedBlock(horse));
    contentBlocks.push(new AnimatedBlock(flowers)); 
    contentBlocks.push(new AnimatedBlock(tree));
    contentBlocks.push(new AnimatedBlock(moon));
    contentBlocks.push(new AnimatedBlock(ship));

    mainColorPalette = new ColorPalette (_.union(colors, contentBlocks), $('#main-color-palette'), mainArea);
    editorAreaColorPalette = new ColorPalette (colors, $('#constructor-color-palette'), editorArea, defaultEditCellSize);
    selectThisBackground(backgrounds[0]);

    // Default to foreground layer and update palette visibility
    selectCanvasLayer('foreground');
  }

};

load();

var exportData = function () {
  var mainPaletteMap = replaceAnimatedBlocksWithTheirLayers(_.cloneDeep(mainColorPalette.map));
  var firstLayerMap = replaceAnimatedBlocksWithTheirLayers(_.cloneDeep(mainArea.selectedDrawableSurface().map));
  var secondLayerMap = replaceAnimatedBlocksWithTheirLayers(_.cloneDeep(mainArea.selectedDrawableSurface().animatedMap));

  var storyData = {
    editor: {
      animatedBlock: {
        layers: editorArea.animatedBlock.layers
      }
    },
    main: {
      palette: mainPaletteMap,
      firstLayer: firstLayerMap,
      secondLayer: secondLayerMap
    },
    options: {
      selectedBackground: selectedBackgroundImage
    }
  };

  return JSON.stringify(storyData);
};

var saveData = function (callback) {
  storyData = exportData();

  // Match alphanumeric story ID (nanoid format)
  var paths = window.location.pathname.match(/\/([A-Za-z0-9]+)\/?(\d+)?/);

  var dataToSave = {
    story: storyData
  };

  // saving a new version just requires an id, don't need to know the current version
  if (paths && paths[1]) {
    dataToSave._id = paths[1];
  }

  $.ajax({
    type: 'post',
    url: '/savestory/',
    data: dataToSave,
    success: function (result) {
      var id = result._id;
      var version = result.version;

      var newPath = '/' + id + (version ? '/' + version : '') + '/';
      if (!Modernizr.history) {
        window.location.pathname = newPath;
      } else {
        History.pushState(null, null, newPath);
      }

      if (callback) {
        callback();
      }
    },
    error: function (error) {
      // do something here
    }
  });
};


$('#import-editor-block').on('click', function (event) {
  event.preventDefault();
  $('#export-editor-block-url-container').hide();

  if ($('#import-editor-block-url-container').is(':visible')) {
    $('#import-editor-block-url-container').hide();
  } else {
    $('#import-editor-block-url-container').show();
  }
});

$('#import-editor-block-button').on('click', function (event) {
  event.preventDefault();

  var importUrl = $('#import-editor-block-url').val();

  var $clickedButton = $(event.currentTarget);

  if (importUrl && $clickedButton.text() === 'Import') {
    $.ajax({
      type: 'GET',
      url: importUrl,
      success: function (result) {
        editorArea.makeNewAnimatedBlock(result.block, {
          uniqueId: editorArea.animatedBlock.uniqueId
        });

        $clickedButton.text('Imported!').css('color', '#00A500');
        setTimeout(function() {
          $clickedButton.text('Import').css('color', '#3f7de0');
        }, 3000);
      }
    });
  }
});

$('#export-editor-block').on('click', function (event) {
  event.preventDefault();
  $('#import-editor-block-url-container').hide();

  if ($('#export-editor-block-url-container').is(':visible')) {
    $('#export-editor-block-url-container').hide();
  } else {
    $('#export-editor-block-url-container').show();

    $.ajax({
      type: 'POST',
      url: '/exportblock/',
      data: {
        block: editorArea.animatedBlock.layers
      },
      success: function (result) {
        $('#export-editor-block-url').val(window.location.protocol + '//' + window.location.host + '/block/' + result._id);
      }
    });
  }
});


$('#export-editor-block-url').on({
  focus: function (event) {
    event.preventDefault();
    $(this).select();
  },
  mouseup: function (event) {
    event.preventDefault();
  }
});


function exportJustMainArea () {
  return JSON.stringify({
    map: replaceAnimatedBlocksWithTheirLayers(_.cloneDeep(mainArea.selectedDrawableSurface().map)),
    animatedMap: replaceAnimatedBlocksWithTheirLayers(_.cloneDeep(mainArea.selectedDrawableSurface().animatedMap))
  });
}

function importJustMainArea (data) {
  var importData = JSON.parse(data);

  $.when(replaceLayersWithAnimatedBlocks(importData.map), replaceLayersWithAnimatedBlocks(importData.animatedMap)).then(function () {
    mainArea.selectedDrawableSurface().map = importData.map;
    mainArea.selectedDrawableSurface().animatedMap = importData.animatedMap;
  });
}

$("#take-tour").on('click', function (event) {
  event.preventDefault();
  hopscotch.endTour();
  hopscotch.startTour(tour, 0);
});

// Auto-save functionality
var autoSaveTimeout;
var isSaving = false;
var $saveStatus = $('#save-status');

function setSaveStatus(status) {
  $saveStatus.removeClass('saving error');
  if (status === 'saving') {
    $saveStatus.addClass('saving').text('Saving...');
  } else if (status === 'error') {
    $saveStatus.addClass('error').text('Error saving');
  } else {
    $saveStatus.text('Saved');
  }
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(performAutoSave, 2000);
}

function performAutoSave() {
  if (isSaving) {
    scheduleAutoSave();
    return;
  }

  isSaving = true;
  setSaveStatus('saving');

  var storyData = exportData();
  // Match alphanumeric story ID (nanoid format)
  var paths = window.location.pathname.match(/\/([A-Za-z0-9]+)\/?(\d+)?/);

  var dataToSave = {
    story: storyData
  };

  if (paths && paths[1]) {
    dataToSave._id = paths[1];
  }

  $.ajax({
    type: 'post',
    url: '/savestory/',
    data: dataToSave,
    success: function (result) {
      isSaving = false;
      setSaveStatus('saved');

      var id = result._id;
      var version = result.version;

      var newPath = '/' + id + (version ? '/' + version : '') + '/';
      if (Modernizr.history) {
        History.replaceState(null, null, newPath);
      }
    },
    error: function (error) {
      isSaving = false;
      setSaveStatus('error');
    }
  });
}

// Prevent leaving page while saving
window.addEventListener('beforeunload', function (e) {
  if (isSaving) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});

// Hook into main canvas mouseup to trigger auto-save
$('#main-area').on('mouseup', function () {
  scheduleAutoSave();
});

// Hook into block deletion from main canvas
$('#delete-block-from-main-canvas').on('click', function () {
  scheduleAutoSave();
});

// Hook into palette block deletion
$('#delete-block').on('click', function () {
  scheduleAutoSave();
});

// Hook into adding block to palette
$('#export-block').on('click', function () {
  scheduleAutoSave();
});



















