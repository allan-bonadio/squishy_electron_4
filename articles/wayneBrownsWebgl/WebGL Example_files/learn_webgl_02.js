/**
 * learn_webgl.js, By Wayne Brown, Fall 2015
 *
 * A learn_webgl object will load and initialize all of the files needed
 * to create 3D graphics in a canvas window.
 *
 * When a webgl program uses data from the runestone edit panels, it
 * cleans up any previous executions of the programs and extracts the
 * data from the editor panes so the WebGL program can be "re-executed".
 *
 * There can be multiple 3D canvas renderings on a single web page, so
 * a learn_webgl object is specific to a canvas window. It is also specific
 * to an instance of a webglcode directive in the runestone system.
 */

"use strict";

/**
 * A Learn_webgl object knows how to download required files for a webgl
 * program, get a valid webgl context, and build webgl programs from
 * shaders. If the context is a runestone directive, it also knows how
 * to grab edited code from codemirror editors and execute a webgl program
 * dynamically.
 *
 * @param canvas_id The id of the canvas element to render to.
 * @param scene_object The name of a function that will create and render a scene.
 * @param model_list A list of models that will be rendered.
 * @param shader_list A list of shader programs.
 * @param control_list A list of control id's (such as buttons, checkboxes, etc.)
 * @param webgl_directive (optional) A runestone webgl_directive.
 * @constructor
 */
function Learn_webgl(canvas_id, scene_object, model_list, shader_list,
                     control_list, webgl_directive) {

  //-----------------------------------------------------------------------
  // Private properties of a Learn_webgl object
  var self = this;
  var downloads_needed = 0;
  var number_retrieved = 0;

  var vshaders = {};
  var fshaders = {};

  var model_data_dictionary = {};  // text data from model files
  var materials_data_dictionary = {}; // text data from materials files

  var model_dictionary = {}; // models
  var materials_dictionary = {}; // materials ['filename']['materialname']

  var controls = [];

  var learn_webgl_id = "";
  var scene = null;

  var out = null;

  //-----------------------------------------------------------------------
  /**
   * Given a new group of models derived from a data file, add them to
   * the model_dictionary. Individual models can be access by both numeric
   * indexes and model name, so each model is added to the model_dictionary
   * twice.
   * @param new_models
   * @private
   */
  function _addModelsToModelDictionary(new_models) {
    var j, model_names, index, name;

    // Add them by index
    if (model_dictionary.number_models === undefined) {
      model_dictionary.number_models = 0;
    }
    for (j = 0; j < new_models.number_models; j += 1) {
      model_dictionary[model_dictionary.number_models] = new_models[j];
      model_dictionary.number_models += 1;
    }

    // Add them by name
    model_names = Object.keys(new_models);
    for (j = 0; j < model_names.length; j += 1) {
      name = model_names[j];
      if (name !== 'number_models' && isNaN(parseInt(name, 10))) {
        model_dictionary[name] = new_models[name];
      }
    }
  }

  //-----------------------------------------------------------------------
  /**
   * This function is called each time a file has been retrieved from the
   * server. After all files have been retrieved, it creates a rendering
   * object and renders the scene in the canvas.
   * @private
   */
  function _initializeRendering() {

    out.displayInfo("In _initializeRendering: " + number_retrieved + " of " +
                downloads_needed + " files have been retrieved");
    if (number_retrieved >= downloads_needed) {
      out.displayInfo("All files have been retrieved!");

      var j, material_keys, material_filename, model_names, name, more_models;
      var materials_for_models;

      // Build all of the material properties from text data
      //material_keys = Object.keys(materials_data_dictionary);
      //for (j = 0; j < material_keys.length; j += 1) {
      //  material_filename = material_keys[j];
      //  materials_for_models = createObjModelMaterials(materials_data_dictionary[material_filename]);
      //  materials_dictionary[material_filename] = materials_for_models;
      //}

      // Build all of the models for rendering
      model_names = Object.keys(model_data_dictionary);
      for (j = 0; j < model_names.length; j += 1) {
        name = model_names[j];
        more_models = createModelsFromOBJ(model_data_dictionary[name], materials_dictionary[name], out);
        _addModelsToModelDictionary(more_models);
      }

      // Create a Scene object which does all the rendering and events
      scene = new window[scene_object](self, vshaders, fshaders, model_dictionary, controls);
      scene.render();
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Given a file name, parse it into its file path, root name, and file extension.
   * @param file_name A string containing a possibly fully qualified file name.
   * @returns Object The file path, root file name, and the file extension.
   * @private
   */
  self.parseFilename = function (file_name) {
    var dot_position, slash_position, path, root, extension;
    var results = { path: "", filename: "", extension: ""};

    // Get the extension
    dot_position = file_name.lastIndexOf('.');
    if (dot_position > 0) {
      results.extension = file_name.substr(dot_position+1);
      results.filename = file_name.substr(0, dot_position);
    } else {
      results.extension = "";
      results.filename = file_name;
    }

    // Get the path
    slash_position = results.filename.lastIndexOf('/');
    if (slash_position > 0) {
      results.path = results.filename.substr(0,slash_position + 1);
      results.filename = results.filename.substr(slash_position + 1);
    } else {
      results.path = "";
    }

    return results;
  };

  //-----------------------------------------------------------------------
  /**
   * Get a shader from the server and save its text in the vshaders or fshaders
   * object. The shaders are stored and retrieved by property names. The
   * property names are taken from the root file name of the shader file.
   * @param shader_filename
   * @private
   */
  function _downloadShader(shader_filename) {

    $.get(shader_filename,
      function (data) {
        var file_extension, name, file_parts;

        out.displayInfo("Shader '" + shader_filename + "' has been downloaded.");
        number_retrieved += 1;

        file_parts = self.parseFilename(shader_filename);
        name = file_parts.filename;
        file_extension = file_parts.extension;

        if (file_extension === 'vert') {
          vshaders[name] = data;
        } else if (file_extension === 'frag') {
          fshaders[name] = data;
        } else {
          out.displayError('Invalid shader file name extension: the name was ' + shader_filename);
        }
        _initializeRendering();
      }
    );
  }

  //-----------------------------------------------------------------------
  /**
   * Given a list of shader file names, download all of them from the server.
   * @param shader_list
   * @private
   */
  function _downloadAllShaders(shader_list) {
    var j;
    for (j = 0; j < shader_list.length; j += 1) {
      _downloadShader(shader_list[j]);
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Download a texture map image.
   * @param obj_filename String The full path and file name to the OBJ file.
   * @param material ModelMaterial A material description.
   * @param image_filename String The filename of a texture map image.
   * @private
   */
  function _downloadTextureMapImage(obj_filename, material, image_filename) {
    var file_parts, path_to_obj, filename;

    // Use the path to the model file to get the materials file.
    file_parts = self.parseFilename(obj_filename);
    path_to_obj = file_parts.path;
    filename = path_to_obj + image_filename;

    out.displayInfo("Texture map image '" + image_filename + "' is requested for OBJ model ", obj_filename);
    downloads_needed += 1;

    material.textureMap = new Image();
    material.textureMap.src = filename;
    material.textureMap.onload =
      function () {
        number_retrieved += 1;
        out.displayInfo("Texture map image '" + image_filename + "' has been downloaded.");

        _initializeRendering();
      };
  }

  //-----------------------------------------------------------------------
  /**
   * The surface material properties of a model are stored in separate
   * files with a .mtl file extension. For a particular model, download
   * its associated materials file and save its data in a property of the
   * materials_data_dictionary. The property name matches the root file name.
   * @param obj_filename String The name of the .obj model file
   * @param mtl_filename String The name of a .MTL material file
   * @private
   */
  function _downloadMaterialsFile(obj_filename, mtl_filename) {
    var myget, file_parts, path_to_obj;
    var j, materials, material_names, name;

    // Use the path to the model file to get the materials file.
    file_parts = self.parseFilename(obj_filename);
    path_to_obj = file_parts.path;
    mtl_filename = path_to_obj + mtl_filename;

    myget = $.get(mtl_filename,
      function (data) {
        number_retrieved += 1;
        out.displayInfo("Materials file '" + mtl_filename + "' has been downloaded.");

        // Process the materials data and store it for the associated OBJ model
        materials = createObjModelMaterials(data);
        materials_dictionary[file_parts.filename] = materials;

        // If any of the materials reference texture map images, download the images
        material_names = Object.keys(materials);
        for (j = 0; j < material_names.length; j += 1) {
          name = material_names[j];
          if (materials[name].map_Kd) {
            _downloadTextureMapImage(obj_filename, materials[name], materials[name].map_Kd);
          }
        }

        _initializeRendering();
      }
      );
    myget.fail(
      function () {
        out.displayInfo("The get for the materials file '" + mtl_filename + "' failed.");
      }
    );
  }

  //-----------------------------------------------------------------------
  /**
   * Download an OBJ model data file from the server.
   * @param obj_filename String The name of the *.obj model file
   * @private
   */
  function _downloadModel(obj_filename) {

    $.get(obj_filename,
      function (data) {
        var file_name, material_filename_list;

        number_retrieved += 1;
        out.displayInfo("Model '" + obj_filename + "' has been downloaded.");

        file_name = self.parseFilename(obj_filename).filename;

        // Remember the data in a dictionary. The key is the file name with
        // the file extension removed.
        model_data_dictionary[file_name] = data;

        material_filename_list = getMaterialFileNamesFromOBJ(data, out);

        out.displayInfo('Found these material MTL files: ' + Object.keys(material_filename_list));

        // Now get all of the material files and increase the number of
        // files that are needed before execution can begin.
        downloads_needed += material_filename_list.length;
        var j;
        for (j = 0; j < material_filename_list.length; j += 1) {
          _downloadMaterialsFile(obj_filename, material_filename_list[j]);
        }

        _initializeRendering();
      }
    );
  }

  //-----------------------------------------------------------------------
  /**
   * Given a list of OBJ model data files, download all of the models.
   * @param model_list
   * @private
   */
  function _downloadAllModels(model_list) {
    var j;
    for (j = 0; j < model_list.length; j += 1) {
      _downloadModel(model_list[j]);
    }
  }

  //-----------------------------------------------------------------------
  /**
   * Get a canvas element given its unique id.
   *
   * @param canvas_id The HTML id of the canvas to render to.
   * @return The matching canvas element
   */
  self.getCanvas = function (canvas_id) {
    var canvas;

    canvas = document.getElementById(canvas_id);
    if (!canvas || canvas.nodeName !== "CANVAS") {
      out.displayError('Fatal error: Canvas "' + canvas_id + '" could not be found');
    } else {
      // Always set the canvas 2D environment to the size of the window
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    return canvas;
  };

  //-----------------------------------------------------------------------
  /**
   * Get a WebGL context from a canvas
   *
   * @param canvas The DOM element that represents the canvas.
   * @return The WebGL context for the canvas.
   */
  self.getWebglContext = function (canvas) {
    var context;

    // The option "preserveDrawingBuffer" turns off the automatic clearing
    // of the frame buffer.
    context = canvas.getContext('webgl', { preserveDrawingBuffer : true } );
    if (!context) {
      out.displayError("No WebGL context could be found.");
    }

    return context;
  };

  /** ---------------------------------------------------------------------
   * Create and compile an individual shader.
   * @param gl WebGLRenderingContext The WebGL context.
   * @param type Number The type of shader, either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
   * @param source String The code/text of the shader
   * @returns WebGLShader A WebGL shader program object.
   */
  self.createAndCompileShader = function (gl, type, source) {
    var typeName;
    switch (type) {
      case gl.VERTEX_SHADER:
        typeName = "Vertex Shader";
        break;
      case gl.FRAGMENT_SHADER:
        typeName = "Fragment Shader";
        break;
      default:
        out.displayError("Invalid type of shader in createAndCompileShader()");
        return null;
    }

    // Create shader object
    var shader = gl.createShader(type);
    if (!shader) {
      out.displayError("Fatal error: gl could not create a shader object.");
      return null;
    }

    // Put the source code into the gl shader object
    gl.shaderSource(shader, source);

    // Compile the shader code
    gl.compileShader(shader);

    // Check for any compiler errors
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      // There are errors, so display them
      var errors = gl.getShaderInfoLog(shader);
      out.displayError('Failed to compile ' + typeName + ' with these errors:' + errors);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  /** ---------------------------------------------------------------------
   * Given two shader programs, create a complete rendering program.
   * @param gl WebGLRenderingContext The WebGL context.
   * @param vertexShaderCode String Code for a vertex shader.
   * @param fragmentShaderCode String Code for a fragment shader.
   * @returns WebGLProgram A WebGL shader program object.
   */
  //
  self.createProgram = function (gl, vertexShaderCode, fragmentShaderCode) {
    // Create the 2 required shaders
    var vertexShader = self.createAndCompileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
    var fragmentShader = self.createAndCompileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);
    if (!vertexShader || !fragmentShader) {
      return null;
    }

    // Create a WebGLProgram object
    var program = gl.createProgram();
    if (!program) {
      out.displayError('Fatal error: Failed to create a program object');
      return null;
    }

    // Attach the shader objects
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // Link the WebGLProgram object
    gl.linkProgram(program);

    // Check for success
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      // There were errors, so get the errors and display them.
      var error = gl.getProgramInfoLog(program);
      out.displayError('Fatal error: Failed to link program: ' + error);
      gl.deleteProgram(program);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
      return null;
    }

    // Remember the shaders. This allows for them to be cleanly deleted.
    program.vShader = vertexShader;
    program.fShader = fragmentShader;

    return program;
  };

  //-----------------------------------------------------------------------
  /**
   *
   * @param filename
   */
  // Update the javascipt code from a codemirror edit pane.
  self.update_javascript_library = function (filename) {
    var script, test_text;

    // Find any script tags in the DOM that have loaded the javascript code
    // and remove them from the DOM.
    $('script[src="' + filename + '"]').remove();

    // Get the new version of the javascript code from the editor window.
    test_text = "var test;";

    // Create a new script tag in the DOM and include the javascript code.
    // This will automatically execute the javascript code.
    script = document.createElement("script");
    script.innerHTML = test_text;
    document.body.appendChild(script);
  };

  //-----------------------------------------------------------------------
  function _updateHTML(file_name, code_mirror) {
    var j, text, start_pos, end_pos, str_length, id;

    // Get the text from the codemirror editor
    text = code_mirror.getValue();

    //   # Extract only the body of the HTML code
    start_pos = text.indexOf('<body');
    start_pos = text.indexOf('>', start_pos) + 1;
    end_pos = text.indexOf("</body>", start_pos);
    str_length = end_pos - start_pos;
    if (start_pos >= 6 && str_length > 0) {
      text = text.substr(start_pos,str_length);

      // Don't reload any scripts, so remove them from the text
      // Remove single line <scripts> first
      var regexp = /<script.*script>\n/gi;
      var matches_array = text.match(regexp);
      for (j = 0; j< matches_array.length; j += 1) {
        text = text.replace(matches_array[j], "");
      }

      // Remove multiple line <scripts> now
      regexp = /<script(.|\n)*script>\n/gi;
      matches_array = text.match(regexp);
      for (j = 0; j< matches_array.length; j += 1) {
        text = text.replace(matches_array[j], "");
      }

      // Put the text into the web page
      id = "#" + learn_webgl_id + "_webgl_canvas";
      $(id).html(text);
    }
  }

  //-----------------------------------------------------------------------
  function _updateOBJ(file_name, code_mirror) {
    var text;

    // Get the text from the codemirror editor
    text = code_mirror.getValue();

    // Update the model data definitions
    var name = self.parseFilename(file_name).filename;
    model_data_dictionary[name] = text;
  }

  //-----------------------------------------------------------------------
  self.updateJavaScript = function (text) {
    try {
      // Evaluate the text in the global context. This will replace any
      // existing code with matching names.
      return eval(text);
    } catch (error) {
      var parts = error.stack.split(':');
      var errorType = parts[0];
      var errorMessage = parts[1].substr(0, parts[1].indexOf('('));
      var subparts = errorMessage.split(' at ');
      errorMessage = subparts[0];
      var errorLocation = subparts[1];
      out.displayError("Error: " + errorType + ': "' + errorMessage + '" in ' + errorLocation);
      return this;
    }
  };

  //-----------------------------------------------------------------------
  function _updateShader(file_name, file_extension, code_mirror) {
    var text;

    // Get the text from the codemirror editor
    text = code_mirror.getValue();

    // Update the shader data definitions
    switch (file_extension) {
      case 'vert':
        vshaders[file_name] = text;
        break;
      case 'frag':
        fshaders[file_name] = text;
        break;
    }
  }

  //-----------------------------------------------------------------------
  self.reload = function () {
    var window_index, equal_index, function_name;
    out.clearMessages();

    if (scene) {
      // Delete all shaders and vob's for all models for the scene
      scene.delete();

      // Get data from the editor buffers and put the new definitions
      // in appropriate places.
      var file_extension, file_name, file_parts, text;
      var j;
      var my_file_names = webgl_directive.file_names;
      var my_code_mirrors = webgl_directive.code_mirrors;
      for (j=0; j < my_code_mirrors.length; j += 1) {
        file_parts = self.parseFilename(my_file_names[j]);
        file_extension = file_parts.extension;
        file_name = file_parts.filename;

        switch (file_extension) {
          case "html":
            _updateHTML(file_name, my_code_mirrors[j]);
            out.displayInfo("Updating definition of html code '" + file_name + "'");
            break;
          case "js":
            // Get the current text from the codemirror editor
            text = my_code_mirrors[j].getValue();

            // Find the name of the function
            window_index = text.indexOf('window.');
            equal_index = text.indexOf('=', window_index);
            function_name = text.slice(window_index+7,equal_index).trim();

            // The code is stored in a property of the window object. Delete the property.
            delete window[function_name];

            // Evaluate the new code in the global context
            doEvalInContext.call(window, text, out);
            out.displayInfo("Updating definition of javascript code '" + file_name + "'");
            break;
          case "obj":
            _updateOBJ(file_name, my_code_mirrors[j]);
            out.displayInfo("Updating definition of model '" + file_name + "'");
            break;
          case "vert":
          case "frag":
            _updateShader(file_name, file_extension, my_code_mirrors[j]);
            out.displayInfo("Updating definition of shader '" + file_name + "'");
            break;
          default:
            out.displayInfo("unrecognized edit file type '" + file_extension + " for file " + file_name );
        }
      }
    }

    // Restart the webgl program with its new data.
    _initializeRendering();
  };

  //-----------------------------------------------------------------------
  self.downloadAll = function () {
    var j, k, n, a_script, all_files, lines, start, end, inner_string, names,
        a_line;

    // Get the html code that defines the "webgl_canvas" <div>
    var id = "#" + learn_webgl_id + "_webgl_canvas";

    // Get the name of the source file for the HTML from the first hidden span
    var span_with_name = $(id).children()[0];
    var html_filename = span_with_name.innerText;

    var all_scripts = $(id).find("script");

    // Gather all the file references
    all_files = [html_filename];
    for (j = 0; j < all_scripts.length; j += 1) {
      a_script = all_scripts[j];
      if (a_script.innerHTML.length === 0) {
        all_files.push( a_script.src );
      } else {
        lines = a_script.innerHTML.split(';');

        // find the lines that have a "variable = [ list ];"
        for (k = 0; k < lines.length; k += 1) {
          a_line = lines[k];
          if (a_line.indexOf("var models") >= 0 ||
              a_line.indexOf("var shaders") >= 0) {
            start = lines[k].indexOf('[');
            if (start >= 0) {
              end = lines[k].indexOf(']', start);
              if (end >= 1) {
                inner_string = lines[k].slice(start + 1, end).trim();
                names = inner_string.split(',');
                for (n = 0; n < names.length; n += 1) {
                  names[n] = names[n].trim();
                  // Remove the leading and trailing quotes
                  names[n] = names[n].slice(1,-1);
                  all_files.push(names[n]);
                }
              }
            }
          }
        }
      }
    }
    console.log("allfiles = ", all_files);

    // Download all the files in the list
    webgl_directive.downloadAllFiles( all_files, self );
  };

  //-----------------------------------------------------------------------
  // Constructor for LearnWebgl object

  if (webgl_directive) {
    // This has a webgl context and it will be used to retrieve files
    // and display information and errors.
    learn_webgl_id = webgl_directive.webgl_id;
  }

  // Publicly accessible data
  self.canvas_id = canvas_id;
  self.out = new LearnWebglConsoleMessages(learn_webgl_id);
  out = self.out;

  // Download all of the external content
  downloads_needed = shader_list.length + model_list.length;
  _downloadAllShaders(shader_list);
  _downloadAllModels(model_list);

  controls = control_list;
}

//-----------------------------------------------------------------------
/**
 * Eval some JavaScript code. The context is set by the .call function
 * @param js_code String The code to evaluate
 * @param out Object An object for displaying output
 */
function doEvalInContext(js_code, out) {
    try {
      // Evaluate the text in the global context. This will replace any
      // existing code with matching names.
      return eval(js_code);
    } catch (error) {
      var parts = error.stack.split(':');
      var errorType = parts[0];
      var errorMessage = parts[1].substr(0, parts[1].indexOf('('));
      var subparts = errorMessage.split(' at ');
      errorMessage = subparts[0];
      var errorLocation = subparts[1];
      out.displayError("Error: " + errorType + ': "' + errorMessage + '" in ' + errorLocation);
    }
}