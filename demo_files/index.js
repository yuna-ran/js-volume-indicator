var client;
var localVideo, localAudio;
var instance

var audioList = [];


client = AgoraRTC.createClient({ mode: "live", codec: "vp8", clientRoleOptions: { audienceLatencyLevelType: 2 }, role: "host" });


let pubed = true;


// autoJoin();
const wait = async (timeout) => {
  await new Promise(res => {
    setTimeout(() => {
      res();
    }, timeout);
  })
}

client.on("user-info-updated", (uid, message) => {
  console.log("user info updated", uid, message);
});

client.on("user-published", handleUserPublished);
client.on("user-unpublished", handleUserUnpublished);
client.on("user-joined", handleUserJoined);
client.on("user-left", handleUserLeft);
// client.on("network-quality", (q) => console.log(q));

document.getElementById("join").onclick = async () => {
  await client.join("f6076d4c249b4885bf74cbbcd7dc411b", "yuna", null);
};
document.getElementById("leave").onclick = async () => {
  await client.leave();
};

let interval = 0;

document.getElementById("pub").onclick = async () => {
  localAudio = await AgoraRTC.createMicrophoneAudioTrack();
  localVideo = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p" });
  localVideo.play("local");
  // localAudio.play();

  await client.publish([localAudio, localVideo]);
  console.log("publish success");
};

document.getElementById("unpub").onclick = async () => {
  await client.unpublish();
  localAudio && localAudio.close();
  localVideo && localVideo.close();
  window.segPluginObject = null;
}

const channelMediaConfig = AgoraRTC.createChannelMediaRelayConfiguration();

let userMap = {};

async function subscribe(uid, mediaType) {
  const user = client.remoteUsers.find(u => u.uid === uid);
  console.log("start subscribe", user);
  await client.subscribe(user, mediaType);
  userMap[uid] = user;
  console.log("subscribe success");

  if (user.audioTrack && !user.audioTrack.isPlaying) {
    user.audioTrack.play();
  }
  if (user.videoTrack && !user.videoTrack.isPlaying) {
    const player = $(`
      <div id="player-${uid}" style="width: 640px; height: 480px;"></div>
    `);
    $("#remote-stream-list").append(player);

    user.videoTrack.play(`player-${uid}`);
  }
}

async function unsubscribe(uid, mediaType) {
  const user = client.remoteUsers.find(u => u.uid === uid);
  console.log("unsubscribe", uid);
  await client.unsubscribe(user, mediaType);
  console.log("unsubscribe success");

  if (!user.videoTrack) {
    $(`#player-${uid}`).remove();
  }
}

function handleUserJoined(user) {
  const id = user.uid;
  $(`#remote-${id}`).remove();
  const item = $(`
    <li id="remote-${id}">
      <p>UID: <span>${id}</span> Audio: <span class="audio">${!!user.hasAudio}</span> Video: <span class="video">${!!user.hasVideo}</span></p>
      <button onclick="subscribe(${id}, 'video')">订阅视频</button>
      <button onclick="subscribe(${id}, 'audio')">订阅音频</button>
      <button onclick="unsubscribe(${id}, 'all')">取消订阅音视频</button>
      <button onclick="unsubscribe(${id}, 'video')">取消订阅视频</button>
      <button onclick="unsubscribe(${id}, 'audio')">取消订阅音频</button>
    </li>
  `);
  $("#remote_list").append(item);
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  const span = $(`#remote-${id} .${mediaType}`);
  if (!span) return;

  span.text(`${mediaType === "audio" ? user.hasAudio : user.hasVideo}`);
}

function handleUserUnpublished(user, mediaType) {
  const id = user.uid;
  const span = $(`#remote-${id} .${mediaType}`);
  if (!span) return;

  span.text(`${mediaType === "audio" ? user.hasAudio : user.hasVideo}`);
}

function handleUserLeft(user) {
  const id = user.uid;
  $(`#remote-${id}`).remove();
}

onload = () => {
  const localVolume1 = document.createElement("p");

  setInterval(() => {
    if (!localAudio) return;
    localVolume1.innerText = "|".repeat(Math.floor(localAudio.getVolumeLevel() * 255));
    console.log(localAudio.getVolumeLevel());
  }, 100);
  document.getElementById("local_volume").appendChild(localVolume1);

}
