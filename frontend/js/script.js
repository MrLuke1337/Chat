const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");

const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");

const documentInput = document.getElementById("document-input");
const userPhotoInput = document.getElementById("user-photo-input");
const userPhotoPreview = document.getElementById("user-photo-preview");
const micButton = document.getElementById("mic-button");

const imageModal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const modalVideo = document.getElementById("modal-video");
const modalClose = document.querySelector(".modal-close");

const colors = ["cadetblue", "darkgoldenrod", "cornflowerblue", "darkkhaki", "hotpink", "gold"];

const user = {
  id: "",
  name: "",
  color: "",
  profilePic: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
};

let websocket;
let mediaRecorder;
let audioChunks = [];

// --- MODAL ---
const openModal = (src, isVideo = false) => {
  if (!src) return;
  if (isVideo) {
    modalVideo.src = src;
    modalVideo.style.display = "block";
    modalImage.style.display = "none";
  } else {
    modalImage.src = src;
    modalImage.style.display = "block";
    modalVideo.style.display = "none";
  }
  imageModal.style.display = "flex";
};

const closeModal = () => {
  imageModal.style.display = "none";
  modalVideo.pause();
  modalVideo.src = "";
  modalImage.src = "";
};

userPhotoPreview.addEventListener("click", () => openModal(userPhotoPreview.src));

// --- PLAYER DE ÁUDIO (SEM AVATAR INTERNO) ---
const createAudioPlayer = (src) => {
  const container = document.createElement("div");
  container.classList.add("wa-audio-container");

  const playBtn = document.createElement("button");
  playBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
  playBtn.classList.add("wa-play-btn");

  const audio = document.createElement("audio");
  audio.src = src;

  const progressContainer = document.createElement("div");
  progressContainer.classList.add("wa-progress-container");
  const progressBar = document.createElement("div");
  progressBar.classList.add("wa-progress-bar");
  progressContainer.appendChild(progressBar);

  const speedBtn = document.createElement("button");
  speedBtn.innerText = "1x";
  speedBtn.classList.add("wa-speed-btn");

  let currentSpeed = 1;
  speedBtn.onclick = () => {
    currentSpeed = currentSpeed === 1 ? 1.5 : currentSpeed === 1.5 ? 2 : 1;
    audio.playbackRate = currentSpeed;
    speedBtn.innerText = `${currentSpeed}x`;
  };

  playBtn.onclick = () => {
    if (audio.paused) {
      audio.play();
      playBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
    } else {
      audio.pause();
      playBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    }
  };

  audio.ontimeupdate = () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${percent || 0}%`;
  };

  audio.onended = () => {
    playBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    progressBar.style.width = "0%";
  };

  container.appendChild(playBtn);
  container.appendChild(progressContainer);
  container.appendChild(speedBtn);
  container.appendChild(audio);

  return container;
};

// --- MENSAGENS ---
const createMessageSelfElement = (content, type, filename) => {
  const div = document.createElement("div");
  div.classList.add("message--self");
  
  if (type === "audio") div.appendChild(createAudioPlayer(content));
  else if (type === "image") {
    const img = document.createElement("img");
    img.src = content;
    img.onclick = () => openModal(img.src);
    div.appendChild(img);
  } else if (type === "video") {
    const video = document.createElement("video");
    video.src = content;
    video.onclick = () => openModal(video.src, true);
    div.appendChild(video);
  } else if (type === "document") {
    const link = document.createElement("a");
    link.href = content;
    link.download = filename;
    link.innerHTML = `<span class="material-symbols-outlined">description</span> ${filename}`;
    link.classList.add("document-message");
    div.appendChild(link);
  } else div.innerHTML = content;
  
  return div;
};

const createMessageOtherElement = (content, sender, senderColor, type, filename, userProfilePic) => {
  const div = document.createElement("div");
  div.classList.add("message--other");

  const container = document.createElement("div");
  container.classList.add("message--sender-container");

  const span = document.createElement("span");
  span.classList.add("message--sender");
  span.style.color = senderColor;
  span.innerHTML = sender;

  const avatarHeader = document.createElement("img");
  avatarHeader.classList.add("message__avatar");
  avatarHeader.src = userProfilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  avatarHeader.onclick = () => openModal(avatarHeader.src);

  container.appendChild(span);
  container.appendChild(avatarHeader);
  div.appendChild(container);

  if (type === "audio") div.appendChild(createAudioPlayer(content));
  else if (type === "image") {
    const img = document.createElement("img");
    img.src = content;
    img.onclick = () => openModal(img.src);
    div.appendChild(img);
  } else if (type === "video") {
    const video = document.createElement("video");
    video.src = content;
    video.onclick = () => openModal(video.src, true);
    div.appendChild(video);
  } else if (type === "document") {
    const link = document.createElement("a");
    link.href = content;
    link.download = filename;
    link.innerHTML = `<span class="material-symbols-outlined">description</span> ${filename}`;
    link.classList.add("document-message");
    div.appendChild(link);
  } else div.innerHTML += content;

  return div;
};

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const scrollScreen = () => (chatMessages.scrollTop = chatMessages.scrollHeight);

const processMessage = ({ data }) => {
  const { userId, userName, userColor, content, type, filename, userProfilePic } = JSON.parse(data);
  const message = userId == user.id
      ? createMessageSelfElement(content, type, filename)
      : createMessageOtherElement(content, userName, userColor, type, filename, userProfilePic);
  
  chatMessages.appendChild(message);
  scrollScreen();
};

const handleLogin = (event) => {
  event.preventDefault();
  user.id = crypto.randomUUID();
  user.name = loginInput.value;
  user.color = getRandomColor();
  login.style.display = "none";
  chat.style.display = "flex";
  websocket = new WebSocket("wss://chat-backend-6fb9.onrender.com");
  websocket.onmessage = processMessage;
};

const sendMessage = (event) => {
  event.preventDefault();
  if (chatInput.value.trim() !== "") {
    websocket.send(JSON.stringify({
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        userProfilePic: user.profilePic,
        content: chatInput.value,
        type: "text",
    }));
    chatInput.value = "";
  }
};

userPhotoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    user.profilePic = reader.result;
    userPhotoPreview.src = reader.result;
  };
  reader.readAsDataURL(file);
});

documentInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    websocket.send(JSON.stringify({
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        userProfilePic: user.profilePic,
        content: reader.result,
        type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document",
        filename: file.name,
    }));
  };
  reader.readAsDataURL(file);
});

micButton.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.onload = () => {
          websocket.send(JSON.stringify({
              userId: user.id,
              userName: user.name,
              userColor: user.color,
              userProfilePic: user.profilePic,
              content: reader.result,
              type: "audio",
          }));
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      micButton.classList.add("recording");
    } catch (err) { alert("Microfone não disponível"); }
  } else {
    mediaRecorder.stop();
    micButton.classList.remove("recording");
  }
});

modalClose.onclick = closeModal;
imageModal.onclick = (e) => { if (e.target === imageModal) closeModal(); };
loginForm.addEventListener("submit", handleLogin);
chatForm.addEventListener("submit", sendMessage);
