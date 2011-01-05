var Field = Class.create(Grid, {
  
  initialize: function($super) {
    $super();

    this.rows = 15;
    this.cols = 10;

    this.width = Brick.SIZE * this.cols;
    this.height = Brick.SIZE * this.rows;

    this.bricks = [];

    this.debugMode = false;

    this.trackLength = 0;
  },
  
  setup: function() {
    this.initializeBox2D();

    this.clearTrack(true);
  },
  
  resetTrack: function() {
    
    this.stopBox2D();
    
    for (var i = 0; i < this.bricks.length; i++) {
      
      this.bricks[i].reset();
      
    }
  },

  initializeBox2D: function() {
    var worldBoundingBox = new b2AABB(),
      gravity = new b2Vec2(0, 9.81);

    worldBoundingBox.lowerBound.Set(-10, -10);
    worldBoundingBox.upperBound.Set(20, 25);

    this.world = new b2World(worldBoundingBox, gravity, true);

    this.createBorders();
    this.initContactListener();

    this.intervalLength = 1 / 120;
  },

  startBox2D: function() {
    
    this.resetTrack();
    var myScope = this;

    this.intervalID = setInterval(function() {
      myScope.calculateBox2D();
    }, this.intervalLength * 1000);
    
    this.validTrack = false;
    $('publishButton').removeClassName('activePublish');
  },

  stopBox2D: function() {
    if (this.intervalID) {
      clearInterval(this.intervalID);
    }
    
    this.intervalID = null;
    this.renderNew = true;
  },

  calculateBox2D: function() {
    
    for (var i = 0; i < this.bricks.length; i++) {
      
      this.bricks[i].update();
      
    }

    this.world.Step(this.intervalLength * 3, 10);
    
  },

  dropBrick: function($super, brick) {
    brick.state = "field";

    if ($super(brick)) {
      brick.createBody(this.world);
    }
  },

  dropBrickAt: function($super, brick, cell) {
    brick.state = "field";
    
    if ($super(brick, cell)) {
      brick.createBody(this.world);
      
      this.validTrack = false;
      $('publishButton').removeClassName('activePublish');
    }
  },

  removeBrickAt: function($super, cell) {
    var brick = this.getBrickAt(cell);

    if (brick) {
      if ($super(cell)) {
        
        brick.removeBody(this.world);
        
        this.validTrack = false;
        $('publishButton').removeClassName('activePublish');
        
        return true;
        
      } else {

        return false;
        
      }
    }
    
    return true;
  },

  draw: function($super, context) {

    if (!this.debugMode) {
      
      $super(context);

    } else {

      this.drawBodies(context);

    }
  },
  
  drawStatics: function(context) {
    
    this.setClipping(context);

      context.translate(this.x, this.y);

      this.drawGrid(context);
      
      this.renderStatics = true;

      this.drawElements(context, true);
      this.drawFieldShadow(context);
      this.drawElements(context, false);
      
      this.renderStatics = false;

      this.drawFrame(context);

    this.releaseClipping(context);
    
  },
  
  drawDynamics: function(context) {
    this.setClipping(context);

      context.translate(this.x, this.y);

      this.renderDynamics = true;
      
      this.drawElements(context, true);
      
      this.renderDynamics = false;

    this.releaseClipping(context);
  },

  onClick: function(mouseX, mouseY) {
    
    var cell = this.getCell(mouseX, mouseY),
        brick = this.getBrickAt(cell);

    if (brick) {

      brick.rotate(Math.PI / 2);

    } else if (cell && this.parent.selectElement && this.parent.selectElement.brick) {

      var dropBrick = new (eval(this.parent.selectElement.brick.type))();
          dropBrick.rotation = this.parent.selectElement.brick.rotation;

      this.dropBrickAt(dropBrick, cell);

    }
    
    this.renderNew = true;
  },
  
  onStartDrag: function(mouseX, mouseY) {
    var brick = this.getBrickAt(this.getCell(mouseX, mouseY));

    if (brick) {

      if (brick.isDragable) {
      
        this.removeBrickAt(brick.cell);
        this.parent.dragBrick(brick);
      
      }
      
    } else {

      this.onDrag(mouseX, mouseY);
      this.parent.startDragBricking();
      
    }
  },
  
  onDrag: function(mouseX, mouseY) {
    
    var cell = this.getCell(mouseX, mouseY),
        brick = this.getBrickAt(cell);

    if (!cell || !this.parent.selectElement) {
      return;
    }
        
    if (this.parent.selectElement.brick) {
      
      if (brick && brick.type == this.parent.selectElement.brick.type &&
        brick.rotation == this.parent.selectElement.brick.rotation) {
        return;
      }

      var dropBrick = new (eval(this.parent.selectElement.brick.type))();
          dropBrick.rotation = this.parent.selectElement.brick.rotation;
          dropBrick.state = "field";

      this.dropBrickAt(dropBrick, cell);
      
    } else {
      
      this.removeBrickAt(cell);
      
    }
    
    this.renderNew = true;
  },

  createBorders: function() {
    var bodyDefinition = new b2BodyDef(),
        shapeDefinitions = [],
        body;

    bodyDefinition.position.Set(0, 0);

    body = this.world.CreateBody(bodyDefinition);

    for (var i = 0; i < 4; i++) {
      shapeDefinitions[i] = new b2PolygonDef();
      shapeDefinitions[i].vertexCount = 4;
      shapeDefinitions[i].restitution = 0;
      shapeDefinitions[i].friction = 0.9;  
    }

    shapeDefinitions[0].vertices[0].Set(this.cols, 0);
    shapeDefinitions[0].vertices[1].Set(0, 0);
    shapeDefinitions[0].vertices[2].Set(0, -1);
    shapeDefinitions[0].vertices[3].Set(this.cols, -1);

    shapeDefinitions[1].vertices[0].Set(this.cols, this.rows);
    shapeDefinitions[1].vertices[1].Set(this.cols, 0);
    shapeDefinitions[1].vertices[2].Set(this.cols + 1, 0);
    shapeDefinitions[1].vertices[3].Set(this.cols + 1, this.rows);

    shapeDefinitions[2].vertices[0].Set(0, this.rows);
    shapeDefinitions[2].vertices[1].Set(this.cols, this.rows);
    shapeDefinitions[2].vertices[2].Set(this.cols, this.rows + 1);
    shapeDefinitions[2].vertices[3].Set(0, this.rows + 1);

    shapeDefinitions[3].vertices[0].Set(0, 0);
    shapeDefinitions[3].vertices[1].Set(0, this.rows);
    shapeDefinitions[3].vertices[2].Set(-1, this.rows);
    shapeDefinitions[3].vertices[3].Set(-1, 0);

    for (var i = 0; i < 4; i++) {
      body.CreateShape(shapeDefinitions[i]);
    }

    body.SetMassFromShapes();
  },
  
  initContactListener: function() {
    
    var contactListener = new b2ContactListener();
    
    contactListener.Add = function(contact) {

      if (contact.shape1.GetBody().onCollision) {
        
        contact.shape1.GetBody().onCollision(contact);
        
      } else if (contact.shape2.GetBody().onCollision) {
        
        contact.shape2.GetBody().onCollision(contact);
        
      }
      
    };

    contactListener.Persist = function(contact) {

      if (contact.shape1.GetBody().whileCollision) {
        
        contact.shape1.GetBody().whileCollision(contact);
        
      } else if (contact.shape2.GetBody().whileCollision) {
        
        contact.shape2.GetBody().whileCollision(contact);
        
      }
      
    };

    contactListener.Remove = function(contact) {

      if (contact.shape1.GetBody().afterCollision) {
        
        contact.shape1.GetBody().afterCollision(contact);
        
      } else if (contact.shape2.GetBody().afterCollision) {
        
        contact.shape2.GetBody().afterCollision(contact);
        
      }
      
    };
    
    this.world.SetContactListener(contactListener);
    
  },

  drawBodies: function(context) {
    context.strokeStyle = "#FF0000";
    context.lineWidth = 1;

    context.save();

      context.translate(this.x, this.y);

      for (var body = this.world.GetBodyList(); body != null; body = body.GetNext()) {
        this.drawBody(context, body);
      }
    
    context.restore();
  },

  drawBody: function(context, body) {
    context.save();
      
      var position = body.GetPosition();

      context.translate(Brick.SIZE * position.x, Brick.SIZE * position.y);
      context.rotate(body.GetAngle());
      context.beginPath();

      context.moveTo(0, 0);
      context.lineTo(0, -Brick.SIZE / 2);
      
      for (var shape = body.GetShapeList(); shape != null; shape = shape.GetNext()) {

        if (shape.m_vertices && shape.m_vertices[0]) {
          context.moveTo(shape.m_vertices[0].x * Brick.SIZE, shape.m_vertices[0].y * Brick.SIZE);

          for (var i = 1; i < shape.m_vertexCount; i++) {

            context.lineTo(shape.m_vertices[i].x * Brick.SIZE, shape.m_vertices[i].y * Brick.SIZE);
            
          } 

          context.lineTo(shape.m_vertices[0].x * Brick.SIZE, shape.m_vertices[0].y * Brick.SIZE);
        }  

      }

      context.stroke();

    context.restore();
  },
  
  setTrack: function(track) {
    
    var error = function(message) {
      
      console.error(message);
      this.clearTrack(true);
      
      return false;
    }
    
    if (!track.bricks || track.bricks.length <= 3)
      return error("track has no/not enough bricks");
    
    this.clearTrack();
    
    var hasBall = false,
        hasExit = false;
    
    for (var b in track.bricks) {
      
      var brick = track.bricks[b];
      
      if (brick.type == "Ball") {
        
        if (hasBall) console.log("track has more than one ball");// return error("track has more than one ball");
        else hasBall = true;
        
      }
      
      if (brick.type == "Exit") {
        
        if (hasExit) console.log("track has more than one exit");// return error("track has more than one exit");
        else hasExit = true;
        
      }
      
      var dropBrick = new (eval(brick.type))();
      
      dropBrick.rotation = brick.rotation * Math.PI / 2;
      
      this.dropBrickAt(
        dropBrick,
        {
          row: brick.row,
          col: brick.col
        }
      );
      
    }
    
    if (!hasBall || !hasExit) {
      console.log("track has no ball and/or exit");// 
      //return error("track has no ball and/or exit");
    }
      
    return true;
  },
  
  getTrack: function() {
    
    this.resetTrack();
    
    var track = {
      bricks: {}
    };
    
    var getRotationAsNumber = function(radians) {
      var number = 0;
      
      while (radians > 0) {
        
        radians -= Math.PI / 2;
        number++;
        
      }
      
      return number %= 4;
    };
    
    for (var i = 0; i < this.bricks.length; i++) {
      
      track.bricks[this.bricks[i].cell.row * this.cols + this.bricks[i].cell.col] = {
        type: this.bricks[i].type,
        rotation: getRotationAsNumber(this.bricks[i].rotation),
        row: this.bricks[i].cell.row,
        col: this.bricks[i].cell.col
      };
      
    }
    
    return track;
    
  },
  
  clearTrack: function(setBallAndExit) {
    
    this.resetTrack();
    
    for (var i = 0; i < this.bricks.length; i++) {
      
      this.bricks[i].removeBody(this.world);
      
    }
    
    this.bricks = [];
    
    if (setBallAndExit) {
      
      this.dropBrickAt(new Ball(), {row: 0, col: 0});
      this.dropBrickAt(new Exit(), {row: (this.rows - 1), col: 0});
      
    }
    
  },

  getTrackImage: function(canvas) {
    
    this.resetTrack();
    
    var context = canvas.getContext("2d");
    var tinyBrickSize = 12;
    var storeBrickSize = Brick.SIZE;

    canvas.width = tinyBrickSize * this.cols + 2;
    canvas.height = tinyBrickSize * this.rows + 2;

    context.save();

      context.translate(.5, .5);

      Brick.SIZE = tinyBrickSize;

      context.strokeStyle = "#000000";
      context.fillStyle = "#FBE500";
      context.lineWidth = 1;

      context.fillRect(0, 0, Brick.SIZE * this.cols, Brick.SIZE * this.rows);
      context.strokeRect(0, 0, Brick.SIZE * this.cols, Brick.SIZE * this.rows);

      context.lineWidth = .5;

      context.beginPath();

      for (var i = 1; i < this.rows; i++) {
        
        context.dashedLine(0, Brick.SIZE * i, Brick.SIZE * this.cols, Brick.SIZE * i, 2);

      }

      for (var i = 1; i < this.cols; i++) {

        context.dashedLine(Brick.SIZE * i, 0, Brick.SIZE * i, Brick.SIZE * this.rows, 2);

      }

      context.stroke();
      context.beginPath(); // Clear Context Buffer

      context.lineWidth = 0;
      context.fillStyle = "#000000";

      for (var i = 0; i < this.bricks.length; i++) {
        context.save();
          
          this.bricks[i].state = "tiny";

          context.translate(this.bricks[i].cell.col * Brick.SIZE, this.bricks[i].cell.row * Brick.SIZE);
          this.bricks[i].draw(context);

          this.bricks[i].state = "field";

        context.restore();
      }

      Brick.SIZE = storeBrickSize;

    context.restore();

    return canvas.toDataURL("image/png");

  }

});
