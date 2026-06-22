/**
 * learn_webgl_ray_model.js, By Wayne Brown, Spring 2016
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
/**
 * Create a model that allows for the GPU buffer objects to be updated
 * before each rendering.
 * @param gl WebGLRenderingContext
 * @param program WebGLProgram
 * @param model ModelArrays The initial definition of the model
 * @param out LearnWebglConsoleMessages can display error messages
 * @constructor
 */
function Create_dynamic_model(gl, program, model, out) {

  var self = this;

  // Variables to remember so the model can be rendered.
  self.number_triangles = 0;
  self.triangles_vertex_buffer_id = null;
  self.triangles_color_buffer_id = null;
  self.triangles_normal_buffer_id = null;
  self.triangles_smooth_normal_buffer_id = null;

  self.number_lines = 0;
  self.lines_vertex_buffer_id = null;
  self.lines_color_buffer_id = null;

  self.number_points = 0;
  self.points_vertex_buffer_id = null;
  self.points_color_buffer_id = null;

  // Make the whole model accessible to other objects.
  self.model = model;

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
      self.number_triangles = model.triangles.vertices.length / 3 / 3;
      self.triangles_vertex_buffer_id = _createBufferObject(model.triangles.vertices);
      self.triangles_color_buffer_id = _createBufferObject(model.triangles.colors);
      self.triangles_normal_buffer_id = _createBufferObject(model.triangles.flat_normals);
      self.triangles_smooth_normal_buffer_id = _createBufferObject(model.triangles.smooth_normals);
    }

    // Build the buffers for the lines
    if (model.lines !== null && model.lines.vertices.length > 0) {
      self.number_lines = model.lines.vertices.length / 3 / 2;
      self.lines_vertex_buffer_id = _createBufferObject(model.lines.vertices);
      self.lines_color_buffer_id = _createBufferObject(model.lines.colors);
    }

    // Build the buffers for the points
    if (model.points !== null && model.points.vertices.length > 0) {
      self.number_points = model.points.vertices.length / 3; // 3 components per vertex
      self.points_vertex_buffer_id = _createBufferObject(model.points.vertices);
      self.points_color_buffer_id = _createBufferObject(model.points.colors);
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
    if (self.number_triangles > 0) {
      gl.deleteBuffer(self.triangles_vertex_buffer_id);
      gl.deleteBuffer(self.triangles_color_buffer_id);
    }
    if (self.number_lines > 0) {
      gl.deleteBuffer(self.lines_vertex_buffer_id);
      gl.deleteBuffer(self.lines_color_buffer_id);
    }
    if (self.number_points > 0) {
      gl.deleteBuffer(self.points_vertex_buffer_id);
      gl.deleteBuffer(self.points_color_buffer_id);
    }
  };

  //-----------------------------------------------------------------------
  /**
   * Render the individual points in the model.
   * @private
   */
  function _renderPoints() {
    if (self.number_points > 0) {
      // Activate the model's vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, self.points_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(program.a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Vertex);

      // Activate the model's point color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, self.points_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Color);

      // Draw all of the lines
      gl.drawArrays(gl.POINTS, 0, self.number_points);
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Render the individual lines in the model.
   * @private
   */
  function _renderLines() {
    if (self.number_lines > 0) {
      // Activate the model's line vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, self.lines_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(program.a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Vertex);

      // Activate the model's line color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, self.lines_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Color);

      // Draw all of the lines
      gl.drawArrays(gl.LINES, 0, self.number_lines * 2);
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Render the triangles in the model.
   * @private
   */
  function _renderTrianglesJustColors() {
    if (self.number_triangles > 0) {
      // Activate the model's triangle vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, self.triangles_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(program.a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Vertex);

      // Activate the model's triangle color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, self.triangles_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(program.a_Color, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.a_Color);

      // Draw all of the triangles
      gl.drawArrays(gl.TRIANGLES, 0, self.number_triangles * 3);
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

  //-----------------------------------------------------------------------
  /**
   * Copy new data into the specified GPU buffer object
   * @param buffer_id Number the buffer object ID
   * @param data Float32Array the array of data values
   */
  self.updateBufferObject = function (buffer_id, data) {
    // Make the buffer object the active buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_id);

    // Upload the data for this buffer object to the GPU.
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  };

}
