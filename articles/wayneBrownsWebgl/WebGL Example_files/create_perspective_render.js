/**
 * create_ortho_render.js, By Wayne Brown, Spring 2016
 */

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 C. Wayne Brown
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

// Global definitions used in this code:
var Learn_webgl_matrix, console;

//-------------------------------------------------------------------------
// Build, create, copy and render 3D objects specific to a particular
// model definition and particular WebGL shaders.
//-------------------------------------------------------------------------
var SceneCreatePerspectiveRender = function (learn, vshaders_dictionary,
                                fshaders_dictionary, models, controls) {

  // Private variables
  var self = this;
  var canvas_id = learn.canvas_id;
  var out = learn.out;

  var gl = null;
  var program = null;
  var render_models = {};

  var matrix = new Learn_webgl_matrix();
  var transform = matrix.create();
  var view_Rx = matrix.create();
  var view_Ry = matrix.create();
  var translate = matrix.create();
  matrix.translate(translate, -2, -2, -4.0);
  var scale = matrix.create();
  var base = matrix.create();
  matrix.scale(scale,6,6,6);

  var world_camera = matrix.create();
  var camera = matrix.create();
  matrix.lookAt(camera, 0, 0, 5, 0, 0, 0, 0, 1, 0);
  var camera_distance = 10;

  var world_orth = matrix.createOrthographic(-10, 10, -10, 10, -100, 100);

  matrix.setIdentity(view_Rx);
  matrix.setIdentity(view_Ry);

  // Public variables that will possibly be used or changed by event handlers.
  self.canvas = null;
  self.angle_x = 20.0 * 0.017453292519943295;
  self.angle_y = 10.0 * 0.017453292519943295;

  self.fovy = 45.0;
  self.aspect = 1.0;
  self.near = 1.0;
  self.far = 10.0;
  self.change_canvas_size = false;

  // For the 2nd canvas render
  var canvas2;
  var gl2;
  var program2;
  var render_models2 = {};
  var camera2 = matrix.create();
  matrix.lookAt(camera2, 0, 0, 5, 0, 0, 0, 0, 1, 0);

  var model_names = ["textz","texty","textx","cubey","cubex","cubez","cube_center"];

  //-----------------------------------------------------------------------
  function _setFrustumVertices() {
    var half_fovy = (self.fovy / 2) *  0.017453292519943295;
    var zn = self.near;
    var zf = self.far;
    var yn = self.near * Math.tan(half_fovy);
    var xn = yn * self.aspect;
    var yf = self.far * Math.tan(half_fovy);
    var xf = yf * self.aspect;

//l 1 2 3 4 1
//l 5 6 7 8 5
//l 1 5
//l 2 6
//l 3 7
//l 4 8
    var vertices = new Float32Array(
      [  xf,  yf, -zf,    xf, -yf, -zf, // line 1-2
         xf, -yf, -zf,   -xf, -yf, -zf, // line 2-3
        -xf, -yf, -zf,   -xf,  yf, -zf, // line 3-4
        -xf,  yf, -zf,    xf,  yf, -zf, // line 4-1
         xn,  yn, -zn,    xn, -yn, -zn, // line 5-6
         xn, -yn, -zn,   -xn, -yn, -zn, // line 6-7
        -xn, -yn, -zn,   -xn,  yn, -zn, // line 7-8
        -xn,  yn, -zn,    xn,  yn, -zn, // line 8-5
         xf,  yf, -zf,    xn,  yn, -zn, // line 1-5
         xf, -yf, -zf,    xn, -yn, -zn, // line 2-6
        -xf, -yf, -zf,   -xn, -yn, -zn, // line 3-7
        -xf,  yf, -zf,   -xn,  yn, -zn  // line 4-8
      ]
    );
    render_models.viewing_volume.updateBufferObject(render_models.viewing_volume.lines_vertex_buffer_id, vertices);
  }

  //-----------------------------------------------------------------------
  this.render = function () {
    var j, ex, ey, ez, dist;

    gl.viewport(0,0,self.canvas.width,self.canvas.height);

    // Clear the entire canvas window background with the clear color
    // out.display_info("Clearing the screen");
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Calculate and set the camera for the entire rendering
    ex = Math.sin(self.angle_x) * camera_distance;
    ez = Math.cos(self.angle_x) * camera_distance;
    ey = Math.sin(self.angle_y) * camera_distance;
    dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
    ex = (ex / dist) * camera_distance;
    ey = (ey / dist) * camera_distance;
    ez = (ez / dist) * camera_distance;
    matrix.lookAt(world_camera, ex, ey, ez, 0, 0, 0, 0, 1, 0);

    // Create the base transform which is built upon for all other transforms
    matrix.multiplySeries(base, world_orth, world_camera);

    // render the frustum
    _setFrustumVertices();
    render_models.viewing_volume.render(base);

    // Create the base transform which is built upon for all other transforms
    matrix.multiplySeries(transform, base, camera);

    // Draw each model
    for (j = 0; j < model_names.length; j += 1) {
      render_models[model_names[j]].render(transform);
    }

    // Combine the transforms into a single transformation
    matrix.multiplySeries(transform, transform, translate);

    // Draw each model
    for (j = 0; j < model_names.length; j += 1) {
      render_models[model_names[j]].render(transform);
    }

    self.render2();
  };

  //-----------------------------------------------------------------------
  this.render2 = function () {
    var j;

    // Clear the entire canvas window background with the clear color
    // out.display_info("Clearing the screen");
    gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT);

    // Build individual transforms
    var perspective = matrix.createPerspective(self.fovy, self.aspect, self.near, self.far);

    // Combine the transforms into a single transformation
    matrix.multiplySeries(transform, perspective, camera);

    // Draw each model
    for (j = 0; j < model_names.length; j += 1) {
      render_models2[model_names[j]].render(transform);
    }

    // Combine the transforms into a single transformation
    matrix.multiplySeries(transform, transform, translate);

    // Draw each model
    for (j = 0; j < model_names.length; j += 1) {
      render_models2[model_names[j]].render(transform);
    }
  };

  //-----------------------------------------------------------------------
  this.delete = function () {
    var j, name;

    // Clean up shader programs
    gl.deleteShader(program.vShader);
    gl.deleteShader(program.fShader);
    gl.deleteProgram(program);

    // Delete each model's VOB
    for (j = 0; j < models.number_models; j += 1) {
      name = models[j].name;
      render_models[name].delete(gl);
    }

    // Remove all event handlers
    var id = '#' + canvas_id;
    $( id ).unbind( "mousedown", events.mouse_drag_started );
    $( id ).unbind( "mouseup", events.mouse_drag_ended );
    $( id ).unbind( "mousemove", events.mouse_dragged );
    events.removeAllEventHandlers();

    // Disable any animation
    self.animate_active = false;
  };

  //-----------------------------------------------------------------------
  // Object constructor. One-time initialization of the scene.

  // Get the rendering context for the canvas
  self.canvas = learn.getCanvas(canvas_id);
  if (self.canvas) {
    gl = learn.getWebglContext(self.canvas);
  }
  if (!gl) {
    return;
  }

  // Set up the rendering program and set the state of webgl
  program = learn.createProgram(gl, vshaders_dictionary["shader05"], fshaders_dictionary["shader05"]);

  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.95, 0.95, 0.95, 1.0);

  // Create Vertex Object Buffers for the models
  var j, name;
  for (j = 0; j < model_names.length; j += 1) {
    name = model_names[j];
    console.log(name);
    render_models[name] = new Learn_webgl_model_render_05(gl, program, models[name], out);
  }

  render_models.viewing_volume = new Create_dynamic_model(gl, program, models.viewing_volume, out);

  // Set up callbacks for user and timer events
  var events;
  events = new CreatePerspectiveEvents(self, controls);

  var id = '#' + canvas_id;
  $( id ).mousedown( events.mouse_drag_started );
  $( id ).mouseup( events.mouse_drag_ended );
  $( id ).mousemove( events.mouse_dragged );

  //-----------------------------------------------------------------------
  // Scene setup for the second canvas.

  // Get the rendering context for the canvas
  canvas2 = learn.getCanvas(canvas_id + "_b");
  if (canvas2) {
    gl2 = learn.getWebglContext(canvas2);
  }
  if (!gl2) {
    return;
  }

  // Set up the rendering program and set the state of webgl
  program2 = learn.createProgram(gl2, vshaders_dictionary["shader05"], fshaders_dictionary["shader05"]);

  gl2.useProgram(program2);

  gl2.enable(gl2.DEPTH_TEST);

  gl2.clearColor(0.95, 0.95, 0.95, 1.0);

  // Create Vertex Object Buffers for the models
  for (j = 0; j < models.number_models; j += 1) {
    name = models[j].name;
    render_models2[name] = new Learn_webgl_model_render_05(gl2, program2, models[name], out);
  }

};

