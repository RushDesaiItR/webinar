// DOM elements.
const roomSelectionContainer = document.getElementById('room-selection-container')
const roomInput = document.getElementById('room-input')
const connectButton = document.getElementById('connect-button')
var body = document.getElementsByTagName("body")[0];
let mainDiv = document.querySelector(".chat-inner") 
const videoChatContainer = document.getElementById('video-chat-container')
const videoChatContainer2 = document.getElementById('video-chat-container2')
const localVideoComponent = document.getElementById('local-video')
const remoteVideoComponent = document.getElementById('remote-video')




$('#uploadfile').bind('change', function(e){
  var data = e.originalEvent.target.files[0];
  readThenSendFile(data);      
});
function readThenSendFile(data){

var reader = new FileReader();
reader.onload = function(evt){
  var msg ={};
  msg.username = "username";
  msg.file = evt.target.result;
  msg.fileName = data.name;
  appendImg(msg, "outgoing")
  socket.emit('base64 file', msg);
  console.log(msg)
};
reader.readAsDataURL(data);

}



// Variables.
const socket = io()
const mediaConstraints = {
  audio: true,
  video: { width: 1280, height: 720 },
}
let localStream
let remoteStream
let isRoomCreator
let rtcPeerConnection // Connection between the local device and the remote peer.
let roomId

// Free public STUN servers provided by Google.
const iceServers = {
  iceServers: [
    // { urls: 'stun:stun.l.google.com:19302' },
    // { urls: 'stun:stun1.l.google.com:19302' },
    // { urls: 'stun:stun2.l.google.com:19302' },
    // { urls: 'stun:stun3.l.google.com:19302' },
    // { urls: 'stun:stun4.l.google.com:19302' },
    {'urls': 'stun:stun.l.google.com:19302'},
    {"urls":"turn:numb.viagenie.ca", "username":"webrtc@live.com", "credential":"muazkh"}
  ],
}
let sendBtn = document.getElementById("send")
let sendBox = document.getElementById("box")
sendBtn.addEventListener("click", function(e) {
   callThis(sendBox.value)
})
function callThis(value) {
  let msg ={
    name:"Rushikesh",
    message:value,
  }
   appendMsg(msg, "outgoing")
   socket.emit("messagemy", msg)
}
function appendMsg(msg, type){
  let newDiv = document.createElement("div")
   let className = type;
   newDiv.classList.add(className, "msg")
   let txt = `
    <span>${msg.name}</span>
    <h5>${msg.message}</h5>
   `;
   newDiv.innerHTML=txt;
   mainDiv.appendChild(newDiv);
}
function appendImg(source, type){
        let newDiv = document.createElement("div")
        let className = type;
        newDiv.classList.add(className, "msg")
        let img= document.createElement("img")
        img.src=source.file
        img.style.width = "100%";
        img.style.height = "100%";
        var a = document.createElement('a');
			  var link = document.createTextNode("Download");
			  a.appendChild(link);
				a.title = "Download";
				a.href = source.file;
        modalImg = document.getElementById('Image');
        modalImg.setAttribute("src", source.file);
        img.addEventListener("click", function(e) {
           document.getElementById('ImageBox').style.display = "flex"
        })
      
        newDiv.appendChild(img)
        newDiv.appendChild(a)
        mainDiv.appendChild(newDiv);
}






socket.on("messagemy",(msg)=>{
  appendMsg(msg, "incoming")
})
socket.on('base64 file', (msg)=>{
  appendImg(msg, "incoming")
})
// BUTTON LISTENER ============================================================
// connectButton.addEventListener('click', () => {
  
//    joinRoom(roomInput.value)
// })
function connectButtonFUn(){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
   const link = urlParams.get('name')
   console.log(link);
 


  console.log("Called.................>..................Q")
  joinRoom(4565)
}



// SOCKET EVENT CALLBACKS =====================================================
socket.on('room_created', async () => {
  console.log('Socket event callback: room_created')

  await setLocalStream(mediaConstraints)
  isRoomCreator = true
})

socket.on('room_joined', async () => {
  console.log('Socket event callback: room_joined')

  await setLocalStream(mediaConstraints)
  socket.emit('start_call', roomId)
})

socket.on('full_room', () => {
  console.log('Socket event callback: full_room')

  alert('The room is full, please try another one')
})

socket.on('start_call', async () => {
  console.log('Socket event callback: start_call')

  if (isRoomCreator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers)
    addLocalTracks(rtcPeerConnection)
    rtcPeerConnection.ontrack = setRemoteStream
    rtcPeerConnection.onicecandidate = sendIceCandidate
    await createOffer(rtcPeerConnection)
  }
})

socket.on('webrtc_offer', async (event) => {
  console.log('Socket event callback: webrtc_offer')

  if (!isRoomCreator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers)
    addLocalTracks(rtcPeerConnection)
    rtcPeerConnection.ontrack = setRemoteStream
    rtcPeerConnection.onicecandidate = sendIceCandidate
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
    await createAnswer(rtcPeerConnection)
  }
})

socket.on('webrtc_answer', (event) => {
  console.log('Socket event callback: webrtc_answer')

  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('webrtc_ice_candidate', (event) => {
  console.log('Socket event callback: webrtc_ice_candidate')

  // ICE candidate configuration.
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  })
  rtcPeerConnection.addIceCandidate(candidate)
})

// FUNCTIONS ==================================================================
function joinRoom(room) {
  if (room === '') {
    alert('Please type a room ID')
  } else {
    roomId = room
    socket.emit('join', room)
    showVideoConference()
  }
}

function showVideoConference() {
  roomSelectionContainer.style = 'display: none'
  videoChatContainer.style = 'display: block'
}

async function setLocalStream(mediaConstraints) {
  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
  } catch (error) {
    console.error('Could not get user media', error)
  }

  localStream = stream
  localVideoComponent.srcObject = stream
}

function addLocalTracks(rtcPeerConnection) {
  localStream.getTracks().forEach((track) => {
    rtcPeerConnection.addTrack(track, localStream)
  })
}

async function createOffer(rtcPeerConnection) {
  let sessionDescription
  try {
    sessionDescription = await rtcPeerConnection.createOffer()
    rtcPeerConnection.setLocalDescription(sessionDescription)
  } catch (error) {
    console.error(error)
  }

  socket.emit('webrtc_offer', {
    type: 'webrtc_offer',
    sdp: sessionDescription,
    roomId,
  })
}

async function createAnswer(rtcPeerConnection) {
  let sessionDescription
  try {
    sessionDescription = await rtcPeerConnection.createAnswer()
    rtcPeerConnection.setLocalDescription(sessionDescription)
  } catch (error) {
    console.error(error)
  }




  socket.emit('webrtc_answer', {
    type: 'webrtc_answer',
    sdp: sessionDescription,
    roomId,
  })
}



function setRemoteStream(event) {
  remoteVideoComponent.srcObject = event.streams[0]
  remoteStream = event.stream
}

function sendIceCandidate(event) {
  if (event.candidate) {
    socket.emit('webrtc_ice_candidate', {
      roomId,
      label: event.candidate.sdpMLineIndex,
      candidate: event.candidate.candidate,
    })
  }
}
