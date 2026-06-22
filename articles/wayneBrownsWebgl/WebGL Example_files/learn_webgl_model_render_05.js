/**
 * learn_webgl_model_render_05.js, By Wayne Brown, Spring 2016
 *
 * Given
 *   - a model definition as defined in learn_webgl_obj_to_arrays.js, and
 * Perform the following tasks:
 *   - Create appropriate Buffers Objects for the model data in the GPU
 *   - Render the model using the shader programs: shader05.vert, shader05.frag
 *   - The model's Buffer Objects can be deleted from the GPU
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

//-------------------------------------------------------------------------
// Build, create, copy and render 3D objects specific to a particular
// model definition and particular WebGL shaders.
//-------------------------------------------------------------------------
/**
 * A class that can create buffer objects for a model, render the model,
 * and delete the model.
 * @param gl Object
 * @param model
 * @param out
 * @constructor
 */
var Learn_webgl_model_render_05 = function (gl, program, model, out) {

  var self = this;

  // Variables to remember so the model can be rendered.
  var number_triangles = 0;
  var triangles_vertex_buffer_id = null;
  var triangles_color_buffer_id = null;
  var triangles_normal_buffer_id = null;
  var triangles_smooth_normal_buffer_id = null;

  var number_lines = 0;
  var lines_vertex_buffer_id = null;
  var lines_color_buffer_id = null;

  var number_points = 0;
  var points_vertex_buffer_id = null;
  var points_color_buffer_id = null;

  //-----------------------------------------------------------------------
  function _createBufferObject(data) {
    // Create a buffer object
    var buffer_id;

    buffer_id = gl.createBuffer();
    if (!buffer_id) {
      out.displayError('Failed to create the buffer object for ' + model.name);
      return null;
    }

    // Make the buffer object the active buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_id);

    // Upload the data for this buffer object to the GPU.
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return buffer_id;
  }

  //-----------------------------------------------------------------------
  /**
   * Create the buffer objects needed and upload the data to the GPU
   * @private
   */
  function _buildBufferObjects() {

    // Build the buffers for the triangles
    if (model.triangles !== null && model.triangles.vertices.length > 0) {
      number_triangles = model.triangles.vertices.length / 3 / 3;
      triangles_vertex_buffer_id = _createBufferObject(model.triangles.vertices);
      triangles_color_buffer_id = _createBufferObject(model.triangles.colors);
      triangles_normal_buffer_id = _createBufferObject(model.triangles.flat_normals);
      triangles_smooth_normal_buffer_id = _createBufferObject(model.triangles.smooth_normals);
    }

    // Build the buffers for the lines
    if (model.lines !== null && model.lines.vertices.length > 0) {
      number_lines = model.lines.vertices.length / 3 / 2;
      lines_vertex_buffer_id = _createBufferObject(model.lines.vertices);
      lines_color_buffer_id = _createBufferObject(model.lines.colors);
    }

    // Build the buffers for the points
    if (model.points !== null && model.points.vertices.length > 0) {
      number_points = model.points.vertices.length / 3; // 3 components per vertex
      points_vertex_buffer_id = _createBufferObject(model.points.vertices);
      points_color_buffer_id = _createBufferObject(model.points.colors);
    }

  }

  //-----------------------------------------------------------------------
  /**
   * Get the location of the shader variables in the shader program.
   * @private
   */
  function _getShaderVariableLocations() {

    program.u_Transform = gl.getUniformLocation(program, "u_Transform");
    program.a_Vertex = gl.getAttribLocation(program, 'a_Vertex');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
  }

  //-----------------------------------------------------------------------
  // These one-time tasks set up the rendering of the models.
  _buildBufferObjects();
  _getShaderVariableLocations();

  //-----------------------------------------------------------------------
  /**
   * Remove the Buffer Objects used by this model on the GPU
   */
  self.delete = function () {
    if (number_triangles > 0) {
      gl.deleteBuffer(triangles_vertex_buffer_id);
      gl.deleteBuffer(triangles_color_buffer_id);
      gl.deleteBuffer(triangles_normal_buffer_id);
      gl.deleteBuffer(triangles_smooth_normal_buffer_id);
    }
    if (number_lines > 0) {
      gl.deleteBuffer(lines_vertex_buffer_id);
      gl.deleteBuffer(lines_color_buffer_id);
    }
    if (number_points > 0) {
      gl.deleteBuffer(points_vertex_buffer_id);
      gl.deleteBuffer(points_color_buffer_id);
    }
  };

  //-----------------------------------------------------------------------
  /**
   * Render the individual points in the model.
   * @private
   */
  function _renderPoints() {
    if (number_points > 0) {
      // Activate the model's vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, points_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(program.a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Vertex);

      // Activate the model's point color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, points_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Color);

      // Draw all of the lines
      gl.drawArrays(gl.POINTS, 0, number_points);
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Render the individual lines in the model.
   * @private
   */
  function _renderLines() {
    if (number_lines > 0) {
      // Activate the model's line vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, lines_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(program.a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Vertex);

      // Activate the model's line color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, lines_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Color);

      // Draw all of the lines
      gl.drawArrays(gl.LINES, 0, number_lines * 2);
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Render the triangles in the model.
   * @private
   */
  function _renderTrianglesJustColors() {
    if (number_triangles > 0) {
      // Activate the model's triangle vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, triangles_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(program.a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Vertex);

      // Activate the model's triangle color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, triangles_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Color);

      // Draw all of the triangles
      gl.drawArrays(gl.TRIANGLES, 0, number_triangles * 3);
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Render the model under the specified transformation.
   * @param transform Learn_webgl_matrix A 4x4 transformation matrix.
   */
  self.render = function (transform) {

    gl.useProgram(program);

    // Set the transform for all the faces, lines, and points
    gl.uniformMatrix4fv(program.u_Transform, false, transform);

    _renderPoints();
    _renderLines();
    _renderTrianglesJustColors();
  };

};
