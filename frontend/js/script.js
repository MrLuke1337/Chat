const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")

const documentInput = document.getElementById("document-input")
const userPhotoInput = document.getElementById("user-photo-input")
const userPhotoPreview = document.getElementById("user-photo-preview")
const micButton = document.getElementById("mic-button")

const imageModal = document.getElementById("image-modal")
const modalImage = document.getElementById("modal-image")
const modalVideo = document.getElementById("modal-video")
const modalClose = document.querySelector(".modal-close")

const colors = ["cadetblue", "darkgoldenrod", "cornflowerblue", "darkkhaki", "hotpink", "gold"]

const user = { 
    id: "", 
    name: "", 
    color: "", 
    profilePic: "https://cdn-icons-png.flaticon.com/512/149/149071.png" 
}

let websocket
let mediaRecorder
let audioChunks = []

const openModal = (src, isVideo = false) => {
    if (isVideo) {
        modalVideo.src = src
        modalVideo.style.display = "block"
        modalImage.style.display = "none"
    } else {
        modalImage.src = src
        modalImage.style.display = "block"
        modalVideo.style.display = "none"
    }
    imageModal.style.display = "flex"
}

const closeModal = () => {
    imageModal.style.display = "none"
    modalVideo.pause()
    modalVideo.src = ""
    modalImage.src = ""
}

const createMessageSelfElement = (content, type, filename) => {
    const div = document.createElement("div")
    div.classList.add("message--self")
    
    if (type === "image") {
        const img = document.createElement("img")
        img.src = content
        img.style.cursor = "pointer"
        img.onclick = () => openModal(img.src)
        div.appendChild(img)
    } else if (type === "video") {
        const video = document.createElement("video")
        video.src = content
        video.style.cursor = "pointer"
        video.onclick = () => openModal(video.src, true)
        div.appendChild(video)
    } else if (type === "audio") {
        const audio = document.createElement("audio")
        audio.src = content
        audio.controls = true
        audio.classList.add("audio-message")
        div.appendChild(audio)
    } else if (type === "document") {
        const link = document.createElement("a")
        link.href = content
        link.download = filename
        link.innerHTML = `<span class="material-symbols-outlined">description</span> ${filename}`
        link.classList.add("document-message")
        div.appendChild(link)
    } else {
        div.innerHTML = content
    }

    return div
}

const createMessageOtherElement = (content, sender, senderColor, type, filename, userProfilePic) => {
    const div = document.createElement("div")
    div.classList.add("message--other")

    const container = document.createElement("div")
    container.classList.add("message--sender-container")

    const span = document.createElement("span")
    span.classList.add("message--sender")
    span.style.color = senderColor
    span.innerHTML = sender

    const avatar = document.createElement("img")
    avatar.classList.add("message__avatar")
    avatar.src = userProfilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    avatar.onclick = () => openModal(avatar.src)

    container.appendChild(span)
    container.appendChild(avatar)
    div.appendChild(container)

    if (type === "image") {
        const img = document.createElement("img")
        img.src = content
        img.style.cursor = "pointer"
        img.onclick = () => openModal(img.src)
        div.appendChild(img)
    } else if (type === "video") {
        const video = document.createElement("video")
        video.src = content
        video.style.cursor = "pointer"
        video.onclick = () => openModal(video.src, true)
        div.appendChild(video)
    } else if (type === "audio") {
        const audio = document.createElement("audio")
        audio.src = content
        audio.controls = true
        audio.classList.add("audio-message")
        div.appendChild(audio)
    } else if (type === "document") {
        const link = document.createElement("a")
        link.href = content
        link.download = filename
        link.innerHTML = `<span class="material-symbols-outlined">description</span> ${filename}`
        link.classList.add("document-message")
        div.appendChild(link)
    } else {
        div.innerHTML += content
    }

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight
}

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content, type, filename, userProfilePic } = JSON.parse(data)

    const message = userId == user.id
        ? createMessageSelfElement(content, type, filename)
        : createMessageOtherElement(content, userName, userColor, type, filename, userProfilePic)

    chatMessages.appendChild(message)
    scrollScreen()
}

const handleLogin = (event) => {
    event.preventDefault()
    user.id = crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()
    login.style.display = "none"
    chat.style.display = "flex"
    websocket = new WebSocket("https://chat-backend-6fb9.onrender.com")
    websocket.onmessage = processMessage
}

const sendMessage = (event) => {
    event.preventDefault()
    if (chatInput.value.trim() !== "") {
        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            userProfilePic: user.profilePic,
            content: chatInput.value,
            type: "text"
        }
        websocket.send(JSON.stringify(message))
        chatInput.value = ""
    }
}

// LÓGICA DE GRAVAÇÃO DE ÁUDIO
micButton.addEventListener("click", async (event) => {
    event.preventDefault() // Evita comportamento padrão do botão no form

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Seu navegador não suporta gravação ou você não está em um ambiente seguro (HTTPS).")
        return
    }

    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorder = new MediaRecorder(stream)
            audioChunks = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data)
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                const reader = new FileReader()
                reader.onload = () => {
                    const message = {
                        userId: user.id,
                        userName: user.name,
                        userColor: user.color,
                        userProfilePic: user.profilePic,
                        content: reader.result,
                        type: "audio"
                    }
                    if (websocket && websocket.readyState === WebSocket.OPEN) {
                        websocket.send(JSON.stringify(message))
                    }
                }
                reader.readAsDataURL(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            micButton.classList.add("recording")
        } catch (err) {
            console.error("Erro ao acessar microfone:", err)
            alert("Não foi possível acessar o microfone.")
        }
    } else {
        mediaRecorder.stop()
        micButton.classList.remove("recording")
    }
})

userPhotoInput.addEventListener("change", (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
        user.profilePic = reader.result
        userPhotoPreview.src = reader.result
    }
    reader.readAsDataURL(file)
})

documentInput.addEventListener("change", (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            userProfilePic: user.profilePic,
            content: reader.result,
            type: isImage ? "image" : (isVideo ? "video" : "document"),
            filename: file.name
        }
        websocket.send(JSON.stringify(message))
    }
    reader.readAsDataURL(file)
    documentInput.value = ""
})

modalClose.onclick = closeModal
imageModal.onclick = (e) => { if (e.target === imageModal) closeModal() }

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)
