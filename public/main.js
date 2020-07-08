let selectedroom = document.getElementById("selectroom")
let roomdiv = document.getElementById("room")
let inputRoomNumber = document.getElementById("roomid")
let gobtn = document.getElementById("go")
let localVideo = document.getElementById("localVideo")
let remoteVideo = document.getElementById("remoteVideo")

let roomnumber, localstream, remotestream, rtcPeerConnection, isCaller

const socket = io()

const iceServers = {
    'iceServer': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun.services.mozilla.com:3478'}
    ]
}

const constraints = {
    audio: true,
    video: true
}

gobtn.onclick = () => {
    if (inputRoomNumber.value === ''){
        alert("Enter Room Name")
    } 
    else{
        roomnumber = inputRoomNumber.value
        socket.emit("create or join", roomnumber)
        selectedroom.style.display = "none"
        roomdiv.style.display = "flex"
    }
}

socket.on('created', room => {
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            localstream = stream
            localVideo.srcObject = stream
            isCaller = true
        })
        .catch(err => {
            alert("Error occured ", err)
        })
})

socket.on('joined', room => {

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            localstream = stream
            localVideo.srcObject = stream
            socket.emit('ready', roomnumber)
        })
        .catch(err => {
            alert("Error occured ",err)
        })
})

socket.on('ready', () => {
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)

        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localstream.getTracks()[0], localstream)
        rtcPeerConnection.addTrack(localstream.getTracks()[1], localstream)

        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('offer', {
                    type : 'offer',
                    sdp : sessionDescription,
                    room : roomnumber
                })
            })
            .catch(err => {
                alert("Error occured ",err)
            })
    }
})

socket.on('offer', sdp => {
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)

        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localstream.getTracks()[0], localstream)
        rtcPeerConnection.addTrack(localstream.getTracks()[1], localstream)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp))

        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer', {
                    type : 'answer',
                    sdp : sessionDescription,
                    room : roomnumber
                })
            })
            .catch(err => {
                alert("Error occured :",err)
            })
    }
})

socket.on('answer', sdp => {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
})

socket.on('candidate', event => {
    const candidate = new RTCIceCandidate({
        sdpMLineIndex : event.label,
        candidate : event.candidate
    })
    rtcPeerConnection.addIceCandidate(candidate)
})

function onAddStream(event) {
    remoteVideo.srcObject = event.streams[0]
    remotestream = event.streams[0]
}

function onIceCandidate(event) {
    if(event.candidate){
        socket.emit('candidate', {
            type : 'candidate',
            label : event.candidate.sdpMLineIndex,
            id : event.candidate.sdpMid,
            candidate : event.candidate.candidate,
            room : roomnumber,
        })
    }
}