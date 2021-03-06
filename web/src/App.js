import './App.css';

import GoldenLayout from 'golden-layout';
import React from 'react';
import ReactDOM from 'react-dom';

import Editor from './Editor';
import Viewer from './Viewer';

import Shaderjob, {shaderjobInit} from './Shaderjob.js';

const default_vs_src = `#version 300 es

out vec2 texCoord;

void main()
{
    float x = -1.0 + float((gl_VertexID & 1) << 2);
    float y = -1.0 + float((gl_VertexID & 2) << 1);
    texCoord.x = (x+1.0)*0.5;
    texCoord.y = (y+1.0)*0.5;
    gl_Position = vec4(x, y, 0, 1);
}
`;

const default_fs_src = `#version 300 es
precision mediump float;

// uniforms
uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;

// in vars
in vec2 texCoord;

// out vars
out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}

// YOUR CODE
//
// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


// See also:
//
// Input - Keyboard    : https://www.shadertoy.com/view/lsXGzf
// Input - Microphone  : https://www.shadertoy.com/view/llSGDh
// Input - Mouse       : https://www.shadertoy.com/view/Mss3zH
// Input - Sound       : https://www.shadertoy.com/view/Xds3Rr
// Input - SoundCloud  : https://www.shadertoy.com/view/MsdGzn
// Input - Time        : https://www.shadertoy.com/view/lsXGz8
// Input - TimeDelta   : https://www.shadertoy.com/view/lsKGWV
// Inout - 3D Texture  : https://www.shadertoy.com/view/4llcR4


float distanceToSegment( vec2 a, vec2 b, vec2 p )
{
	vec2 pa = p - a, ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = fragCoord.xy / iResolution.xx;
    vec4 m = iMouse / iResolution.xxxx;

	vec3 col = vec3(0.0);

	if( m.z>0.0 )
	{
		float d = distanceToSegment( m.xy, m.zw, p );
    col = mix( col, vec3(1.0,1.0,0.0), 1.0-smoothstep(.004,0.008, d) );
	}

	col = mix( col, vec3(1.0,0.0,0.0), 1.0-smoothstep(0.03,0.035, length(p-m.xy)) );
  col = mix( col, vec3(0.0,0.0,1.0), 1.0-smoothstep(0.03,0.035, length(p-abs(m.zw))) );

	fragColor = vec4( col, 1.0 );
}`;


const CANVASID = "shaderjob-canvas";

class App extends React.Component {
  constructor(props) {
    super(props);
    const vs = localStorage.getItem("vs") || default_vs_src;
    const fs = localStorage.getItem("fs") || default_fs_src;
    this.state = {
      vs: vs,
      fs: fs,
      sj: null
    };
    const self = this;
    const onReady = () => {
      self.setState((prev, props) => {
        const next = prev;
        next.sj = new Shaderjob(CANVASID, 2);
        next.sj.set_program(next.vs, next.fs);

        return next;
      });
    };
    shaderjobInit(onReady);
  }

  componentDidMount() {
    const self = this;
    const onVertChange = (s) => {
      self.setState((prev, props) => {
        return {
          vs: s,
          fs: prev.fs,
          sj: prev.sj
        };
      });
      localStorage.setItem("vs", s);

      if (self.state.sj) {
        return self.state.sj.set_program(s, self.state.fs);
      } else {
        return null;
      }
    };

    const onFragChange = (s) => {
      self.setState((prev, props) => {
        return {
          vs: prev.vs,
          fs: s,
          sj: prev.sj
        };
      });

      localStorage.setItem("fs", s);
      if (self.state.sj) {
        return self.state.sj.set_program(self.state.vs, s);
      } else {
        return null;
      }
    };

    const shaderjob = () => {
      return self.state.sj;
    };

    const config = {
      settings: {
        hasHeaders: true,
        constrainDragToContainer: true,
        reorderEnabled: true,
        selectionEnabled: false,
        popoutWholeStack: false,
        showPopoutIcon: false,
        showMaximiseIcon: true,
        showCloseIcon: false
      },
      content: [{
        type: 'row',
        content: [{
            type: 'stack',
            activeItemIndex: 1,
            content: [
            {
              type: 'react-component',
              component: 'Editor',
              props: {
                title: "vertex",
                value: this.state.vs,
                onChange: onVertChange
              }
            },
            {
              type: 'react-component',
              component: 'Editor',
              props: {
                title: "fragment",
                value: this.state.fs,
                onChange: onFragChange
              },
            }
            ]},
          {type: 'react-component',
            component: 'Viewer',
            props: {
              sj: shaderjob,
              canvasId: CANVASID,
            },
          },
        ]
      }]
    };

    this.layout = new GoldenLayout(config, this.domNode);
    this.layout.registerComponent('Editor', Editor);
    this.layout.registerComponent('Viewer', Viewer);
    this.layout.init();

    // TODO(jshrake): ensure React and ReactDOM are
    // in the global scope for goldenlayout
    window.React = React;
    window.ReactDOM = ReactDOM;
    window.addEventListener('resize', () => {
      this.layout.updateSize();
    });
  }

  render() {
    return (
      <div style = {
      { height: '100vh' }} ref = {
      input => this.domNode = input
    } />
    );
  }
}

export default App;
