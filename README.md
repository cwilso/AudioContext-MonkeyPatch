AudioContext monkeypatch
==============================

This monkeypatch library is intended to be included in projects that are
written to the proper AudioContext spec (instead of webkitAudioContext), 
and that use the new naming and proper bits of the Web Audio API (e.g. 
using BufferSourceNode.start() instead of BufferSourceNode.noteOn()), but may
have to run on systems that only support the deprecated bits.

Kumar: This version of the patch is bi-directional - i.e. it makes new
names available in older implementations and vice versa, so that old
code can keep running while new code works as well. It supports
the following 4 use cases -

1. Old code + New unprefixed implementation
2. Old code + Old prefixed implementation with old names
3. New code + New unprefixed implementation
4. New code + Old prefixed implementation with old names

The patches this library handles:
---------------------------------
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

You can copy the AudioContextMonkeyPatch.js into your project if you
like, or include it as http://cwilso.github.com/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js.

Kumar: Note that the aliasing is both ways - i.e. if only noteOn/noteOff is
available, start() and stop() will be added to work using those.
