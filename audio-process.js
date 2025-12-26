class audioProcess extends AudioWorkletProcessor {
  process(inputs,outputs,parameters){
    const sample = inputs[0]?.[0];
    if(sample){
      this.port.postMessage(sample.slice());
    }  
    return true;
  }
  }
registerProcessor("audio-process",audioProcess);