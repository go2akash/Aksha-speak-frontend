function rms(samples){
  let sum =0;
  for (let i =0;i<samples.length;i++){
    sum+= samples[i]*samples[i]
  }
  return Math.sqrt(sum/samples.length);
}
async function main() {
  const audioContext = new AudioContext();
  await audioContext.resume();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  await audioContext.audioWorklet.addModule("audio-process.js");
  const audioNode = new AudioWorkletNode(audioContext, "audio-process");
  const socket = new WebSocket("ws://localhost:8000/ws/audio/");
  socket.binaryType = "arraybuffer";
  let pcmBuffer = new Float32Array(0);
  const targetedSample = 1920; //~40ms @48khz
  socket.onopen = () => {
    console.log("WebSocket connection established");
    audioNode.port.onmessage = (event) => {
      const chunk = event.data;
      const energy = rms(chunk);
      const newBuffer = new Float32Array(pcmBuffer.length + chunk.length);
      newBuffer.set(pcmBuffer, 0);
      newBuffer.set(chunk, pcmBuffer.length);
      pcmBuffer = newBuffer;

      if (pcmBuffer.length >= targetedSample) {
        const toSend = pcmBuffer.slice(0, targetedSample);
        socket.send(toSend.buffer);
        console.log("sent samples:", toSend.length);
        pcmBuffer = pcmBuffer.slice(targetedSample);
      }
    };
  };
  source.connect(audioNode);

  const silent = audioContext.createGain();
  silent.gain.value = 0;

  audioNode.connect(silent);
  silent.connect(audioContext.destination);
}

document.getElementById("start-btn").addEventListener("click", main);
