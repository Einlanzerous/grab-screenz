const { writeFile } = require('fs');
const { desktopCapturer, remote } = require('electron');
const { Menu, dialog } = remote;

// Buttons
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// Get available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

// Create mediaRecorder instance to capture footage
let mediaRecorder;
const recordedChunks = [];

// Change the source window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview selected source
  videoElement.srcObject = stream;
  videoElement.play();

  // Create a Media Recorder
  const options = {
    mimeType: 'video/webm; codecs=vp9'
  };
  mediaRecorder = new mediaRecorder(stream, options);

  // Register Event Handlers for Media Recorder
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
function handleDataAvailable(element) {
  console.log('Video now available');
  recordedChunks.push(element.data);
};

// Saves video file on stop
async function handleStop(element) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save Video',
    defaultPath: `grabed-screen${Date.now()}.webm`
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log('Video saved successfully'));
}
