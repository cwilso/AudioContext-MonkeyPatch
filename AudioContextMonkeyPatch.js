/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* 

This monkeypatch library is intended to be included in projects that are
written to the proper AudioContext spec (instead of webkitAudioContext), 
and that use the new naming and proper bits of the Web Audio API (e.g. 
using BufferSourceNode.start() instead of BufferSourceNode.noteOn()), but may
have to run on systems that only support the deprecated bits.

This library should be harmless to include if the browser supports 
unprefixed "AudioContext", and/or if it supports the new names.  

The patches this library handles:
if window.AudioContext is unsupported, it will be aliased to webkitAudioContext().
if AudioBufferSourceNode.start() is unimplemented, it will be routed to noteOn() or
noteGrainOn(), depending on parameters.

The following aliases only take effect if the new names are not already in place:

AudioBufferSourceNode.stop() is aliased to noteOff()
AudioContext.createGain() is aliased to createGainNode()
AudioContext.createDelay() is aliased to createDelayNode()
AudioContext.createScriptProcessor() is aliased to createJavaScriptNode()
OscillatorNode.start() is aliased to noteOn()
OscillatorNode.stop() is aliased to noteOff()
AudioParam.setTargetAtTime() is aliased to setTargetValueAtTime()

This library does NOT patch the enumerated type changes, as it is 
recommended in the specification that implementations support both integer
and string types for AudioPannerNode.panningModel, AudioPannerNode.distanceModel 
BiquadFilterNode.type and OscillatorNode.type.

*/

/*
srikumarks (a.k.a. Kumar): In the code below, all the name aliasing is done at
the time the audio context is instantiated. This approach also makes no
reference to current parameter sets of other nodes so that it is robust to the
api evolving to some extent -- it only depends on the gain node having a "gain"
parameter.

This code behaves differently than Chris Wilson's original intention
stated above. It makes both old and new names available in the unprefixed 
and prefixed context so that old and new code will run in old and new
client implementations.
*/
;(function () {
    var GLOBAL = this;

    GLOBAL.AudioContext = GLOBAL.webkitAudioContext = (function (AC) {
        'use strict';

        if (!AC) {
            throw new Error('No AudioContext available in this browser.');
        }

        return function AudioContext() {
            var ac, AudioParam, AudioParamOld, BufferSource, Oscillator;

            if (arguments.length === 0) {
                // Realtime audio context.
                ac = new AC;
            } else if (arguments.length === 3) {
                // Offline audio context.
                ac = new AC(arguments[0], arguments[1], arguments[2]);
            } else {
                throw new Error('Invalid instantiation of AudioContext');
            }

            ac.createGain = ac.createGainNode = (ac.createGain || ac.createGainNode);
            ac.createDelay = ac.createDelayNode = (ac.createDelay || ac.createDelayNode);
            ac.createScriptProcessor = ac.createJavaScriptNode = (ac.createScriptProcessor || ac.createJavaScriptNode);

            // Find out the AudioParam prototype object.
            // Some older implementations keep an additional empty
            // interface for the gain parameter.
            AudioParam = Object.getPrototypeOf(ac.createGain().gain);
            AudioParamOld = Object.getPrototypeOf(AudioParam);
            if (AudioParamOld.setValueAtTime) {
                // Checking for the presence of setValueAtTime to find whether
                // it is the right prototype class is, I expect, more robust than
                // checking whether the class name is this or that. - Kumar
                AudioParam = AudioParamOld;
            }

            AudioParam.setTargetAtTime = AudioParam.setTargetValueAtTime = (AudioParam.setTargetAtTime || AudioParam.setTargetValueAtTime);

            // For BufferSource node, we need to also account for noteGrainOn.
            BufferSource = Object.getPrototypeOf(ac.createBufferSource());
            if (BufferSource.start) {
                if (!BufferSource.noteOn) {
                    BufferSource.noteOn = function noteOn(when) {
                        return this.start(when); // Ignore other arguments.
                    };
                }
                BufferSource.noteOff = BufferSource.stop;
                if (!BufferSource.noteGrainOn) {
                    BufferSource.noteGrainOn = function noteGrainOn(when, offset, duration) {
                        return this.start(when, offset, duration);
                    };
                }
            } else {
                BufferSource.start = function start(when, offset, duration) {
                    switch (arguments.length) {
                        case 1: return this.noteOn(when);
                        case 3: return this.noteGrainOn(when, offset, duration);
                        default: throw new Error('Invalid arguments to BufferSource.start');
                    }
                };
                BufferSource.stop = BufferSource.noteOff;
            }


            Oscillator = Object.getPrototypeOf(ac.createOscillator());
            Oscillator.start = Oscillator.noteOn = (Oscillator.start || Oscillator.noteOn);
            Oscillator.stop = Oscillator.noteOff = (Oscillator.stop || Oscillator.noteOff);

            return ac;
        };
    }(GLOBAL.AudioContext || GLOBAL.webkitAudioContext));
}());

