const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")

// Removida a linha do file-input
const documentInput = document.getElementById("document-input")
const userPhotoInput = document.getElementById("user-photo-input")
const userPhotoPreview = document.getElementById("user-photo-preview")

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
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
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
