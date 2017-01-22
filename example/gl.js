var regl = require('regl')()
var glsl = require('glslify')
var camera = require('../')(location.hash.replace(/^#/,'') || `
  +proj=tmerc +lat_0=18.83333333333333 +lon_0=-155.5 +ellps=GRS80 +units=m
  +k_0=0.0000019268500651226404 +x_0=0.35589838645697514
  +y_0=-0.34185734540971613`.trim())

camera.on('update', function () {
  location.hash = camera.string()
})

var mesh = require('./hawaii.json')
var draw = regl({
  frag: `
    precision mediump float;
    void main () {
      gl_FragColor = vec4(0.5,0.5,0.5,1);
    }
  `,
  vert: glsl`
    precision mediump float;
    #pragma glslify: forward = require('glsl-proj4/tmerc/forward')
    #pragma glslify: proj_t = require('glsl-proj4/tmerc/t')
    uniform proj_t proj;
    attribute vec2 position;
    uniform float aspect;
    void main () {
      vec3 p = forward(proj, position)*vec3(1,aspect,1);
      gl_Position = vec4(p,1);
    }
  `,
  attributes: {
    position: mesh.positions
  },
  uniforms: Object.assign(camera.members('proj'), {
    aspect: function (context) {
      return context.viewportWidth / context.viewportHeight
    }
  }),
  elements: mesh.cells
})

regl.frame(function () {
  regl.clear({ color: [1,1,1,1], depth: true })
  draw()
})
